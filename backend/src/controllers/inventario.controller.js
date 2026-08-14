const db = require('../config/db');

// 1. Obtener catálogo de vidrios 
exports.obtenerTiposVidrio = async (req, res) => {
    try {
        const [vidrios] = await db.query('SELECT * FROM tipos_vidrio');
        res.json(vidrios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el catálogo de vidrios." });
    }
};

// 2. Obtener el stock principal de planchas
exports.obtenerStockPlanchas = async (req, res) => {
    try {
        const [stock] = await db.query(`
            SELECT p.id_plancha, v.nombre AS tipo_vidrio, p.ancho_estandar_cm, p.alto_estandar_cm, p.cantidad_stock 
            FROM inventario_planchas p
            JOIN tipos_vidrio v ON p.id_vidrio = v.id_vidrio
        `);
        res.json(stock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el stock de planchas." });
    }
};

// 3. Obtener la lista de mermas/retazos disponibles
exports.obtenerRetazosDisponibles = async (req, res) => {
    try {
        const [retazos] = await db.query(`
            SELECT r.id_retazo, v.nombre AS tipo_vidrio, r.ancho_cm, r.alto_cm, r.ubicacion 
            FROM retazos r
            JOIN tipos_vidrio v ON r.id_vidrio = v.id_vidrio
            WHERE r.estado = 'Disponible'
        `);
        res.json(retazos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener la lista de retazos." });
    }
};

// 4. Catalogo de Marcos
exports.obtenerTiposMarco = async (req, res) => {
    try {
        const [marcos] = await db.query('SELECT * FROM tipos_marco');
        res.json(marcos);
    } catch (error) {
        console.error("Error al obtener marcos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// 5. Gestion de Inventario (Agregar o Eliminar)

exports.registrarIngreso = async (req, res) => {
    const { tipo_elemento, id_elemento, cantidad, id_usuario, motivo } = req.body;

    if (!tipo_elemento || !id_elemento || !cantidad || !id_usuario) {
        return res.status(400).json({ error: "Faltan datos para registrar el ingreso." });
    }

    try {
        if (tipo_elemento === 'Plancha') {
            // Sumar stock a la plancha
            await db.query('UPDATE inventario_planchas SET cantidad_stock = cantidad_stock + ? WHERE id_plancha = ?', [cantidad, id_elemento]);
            // Registrar auditoría
            await db.query(`INSERT INTO movimientos_inventario (id_plancha, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                VALUES (?, ?, 'Ingreso', ?, ?, NOW())`, [id_elemento, id_usuario, cantidad, motivo || 'Recepción de proveedor']);
        
        } else if (tipo_elemento === 'Marco') {
            
            const [invMarcoRows] = await db.query(
                'SELECT id_inventario_marco FROM inventario_marcos WHERE id_marco = ? LIMIT 1', 
                [id_elemento]
            );

            if (invMarcoRows.length > 0) {
                const idInvMarcoReal = invMarcoRows[0].id_inventario_marco;

                // Sumar stock usando el ID real
                await db.query('UPDATE inventario_marcos SET cantidad_stock = cantidad_stock + ? WHERE id_inventario_marco = ?', [cantidad, idInvMarcoReal]);
                
                // Registrar auditoría usando el ID real
                await db.query(`INSERT INTO movimientos_inventario (id_inventario_marco, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                    VALUES (?, ?, 'Ingreso', ?, ?, NOW())`, [idInvMarcoReal, id_usuario, cantidad, motivo || 'Recepción de proveedor']);
            } else {
                return res.status(404).json({ error: "No se encontró el marco físico en inventario." });
            }
        }

        res.json({ success: true, mensaje: `Ingreso de ${cantidad} ${tipo_elemento}(s) registrado correctamente.` });
    } catch (error) {
        console.error("Error al registrar ingreso:", error);
        res.status(500).json({ error: "Error en el servidor al ingresar stock." });
    }
};
// 2. Dar de baja material (Quebrados, defectuosos o limpieza)
exports.registrarBaja = async (req, res) => {
    const { tipo_elemento, id_elemento, cantidad, id_usuario, motivo } = req.body;

    if (!tipo_elemento || !id_elemento || !id_usuario || !motivo) {
        return res.status(400).json({ error: "Faltan datos. El motivo es obligatorio para dar de baja." });
    }

    try {
        if (tipo_elemento === 'Plancha') {
            await db.query('UPDATE inventario_planchas SET cantidad_stock = cantidad_stock - ? WHERE id_plancha = ?', [cantidad, id_elemento]);
            await db.query(`INSERT INTO movimientos_inventario (id_plancha, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                VALUES (?, ?, 'Baja', ?, ?, NOW())`, [id_elemento, id_usuario, cantidad, motivo]);

        } else if (tipo_elemento === 'Marco') {
            
            const [invMarcoRows] = await db.query(
                'SELECT id_inventario_marco FROM inventario_marcos WHERE id_marco = ? LIMIT 1', 
                [id_elemento]
            );

            if (invMarcoRows.length > 0) {
                const idInvMarcoReal = invMarcoRows[0].id_inventario_marco;

                // Descontar stock usando el ID real
                await db.query('UPDATE inventario_marcos SET cantidad_stock = cantidad_stock - ? WHERE id_inventario_marco = ?', [cantidad, idInvMarcoReal]);
                
                // Registrar movimiento usando el ID real
                await db.query(`INSERT INTO movimientos_inventario (id_inventario_marco, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                    VALUES (?, ?, 'Baja', ?, ?, NOW())`, [idInvMarcoReal, id_usuario, cantidad, motivo]);
            } else {
                return res.status(404).json({ error: "No se encontró el marco en el inventario físico." });
            }

        } else if (tipo_elemento === 'Retazo') {
            await db.query('UPDATE retazos SET estado = "Descartado" WHERE id_retazo = ?', [id_elemento]);
            await db.query(`INSERT INTO movimientos_inventario (id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                VALUES (?, 'Baja', 1, ?, NOW())`, [id_usuario, motivo]);
        }

        res.json({ success: true, mensaje: `Baja de ${tipo_elemento} registrada correctamente.` });
    } catch (error) {
        console.error("Error al dar de baja:", error);
        res.status(500).json({ error: "Error en el servidor al dar de baja." });
    }
};

exports.obtenerInventarioGeneral = async (req, res) => {
    try {
        // 1. Obtener Planchas
        const [planchas] = await db.query(`
            SELECT ip.id_plancha, tv.nombre, tv.espesor_mm, ip.ancho_estandar_cm, ip.alto_estandar_cm, ip.cantidad_stock 
            FROM inventario_planchas ip 
            JOIN tipos_vidrio tv ON ip.id_vidrio = tv.id_vidrio
        `);

        // 2. Obtener Marcos (Excluyendo el ID 1 que es "Sin Marco")
        const [marcos] = await db.query(`
            SELECT im.id_inventario_marco, tm.nombre, tm.material, im.largo_estandar_cm, im.cantidad_stock 
            FROM inventario_marcos im 
            JOIN tipos_marco tm ON im.id_marco = tm.id_marco
            WHERE im.id_marco != 1
        `);

        // 3. Obtener Retazos Disponibles
        const [retazos] = await db.query(`
            SELECT r.id_retazo, tv.nombre as tipo_vidrio, tv.espesor_mm, r.ancho_cm, r.alto_cm, r.ubicacion 
            FROM retazos r
            JOIN tipos_vidrio tv ON r.id_vidrio = tv.id_vidrio
            WHERE r.estado = 'Disponible'
        `);

        // Enviar todo junto
        res.json({ planchas, marcos, retazos });
    } catch (error) {
        console.error("Error al obtener inventario general:", error);
        res.status(500).json({ error: "Error en el servidor al cargar inventario." });
    }
};