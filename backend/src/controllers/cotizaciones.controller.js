const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');


exports.procesarCotizacion = async (req, res) => {
    const { id_usuario, nombre_cliente, id_vidrio, id_marco, ancho_solicitado, alto_solicitado, es_venta_confirmada } = req.body;

    if (!id_usuario || !id_vidrio || !ancho_solicitado || !alto_solicitado) {
        return res.status(400).json({ error: "Faltan datos obligatorios para el cálculo." });
    }

    try {
        // 1. MATEMÁTICA PURA 
        const [vidrioRows] = await db.query('SELECT * FROM tipos_vidrio WHERE id_vidrio = ?', [id_vidrio]);
        if (vidrioRows.length === 0) return res.status(404).json({ error: "El tipo de vidrio no existe." });
        
        const vidrio = vidrioRows[0];
        const areaM2 = (ancho_solicitado / 100) * (alto_solicitado / 100);
        const costoVidrio = areaM2 * vidrio.precio_m2;

        const marcoSeleccionado = id_marco || 1;
        const [marcoRows] = await db.query('SELECT precio_metro_lineal FROM tipos_marco WHERE id_marco = ?', [marcoSeleccionado]);
        const costoMarco = (((ancho_solicitado + alto_solicitado) * 2) / 100) * marcoRows[0].precio_metro_lineal;

        const subtotal = costoVidrio + costoMarco;

        let id_retazo_usado = null;
        let mensaje_optimizacion = "Cotización de referencia generada. No se descontó material ni se guardó en el historial.";
        let mermas_guardadas = 0;
        let estado_boleta = 'Pendiente'; 
        let id_cotizacion_generada = "Solo Consulta"; 

        // 2. LÓGICA DE INVENTARIO Y GUARDADO 
        if (es_venta_confirmada) {
            estado_boleta = 'Trabajando'; 

            // A) Lógica Vidrio (Retazos o Plancha nueva)
            const [retazoRows] = await db.query(`
                SELECT * FROM retazos 
                WHERE id_vidrio = ? AND estado = 'Disponible'
                AND ((ancho_cm >= ? AND alto_cm >= ?) OR (ancho_cm >= ? AND alto_cm >= ?))
                ORDER BY (ancho_cm * alto_cm) ASC LIMIT 1
            `, [id_vidrio, ancho_solicitado, alto_solicitado, alto_solicitado, ancho_solicitado]);

            if (retazoRows.length > 0) {
                const retazoUsado = retazoRows[0];
                id_retazo_usado = retazoUsado.id_retazo;
                mensaje_optimizacion = `Material optimizado: Se utilizó el retazo ID ${id_retazo_usado}.`;
                await db.query('UPDATE retazos SET estado = "Utilizado" WHERE id_retazo = ?', [id_retazo_usado]);
            } else {
                const [planchaRows] = await db.query('SELECT * FROM inventario_planchas WHERE id_vidrio = ? AND cantidad_stock > 0 LIMIT 1', [id_vidrio]);
                if (planchaRows.length === 0) return res.status(400).json({ error: "No hay stock suficiente de vidrio." });
                
                const plancha = planchaRows[0];
                await db.query('UPDATE inventario_planchas SET cantidad_stock = cantidad_stock - 1 WHERE id_plancha = ?', [plancha.id_plancha]);
                await db.query(`INSERT INTO movimientos_inventario (id_plancha, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                                VALUES (?, ?, 'Salida', 1, 'Consumo por venta', NOW())`, [plancha.id_plancha, id_usuario]);

                mensaje_optimizacion = "Se consumió una plancha nueva de bodega.";

                const retazoA_ancho = plancha.ancho_estandar_cm - ancho_solicitado;
                const retazoB_alto = plancha.alto_estandar_cm - alto_solicitado;

                if (retazoA_ancho >= 20 && plancha.alto_estandar_cm >= 20) {
                    await db.query(`INSERT INTO retazos (id_vidrio, ancho_cm, alto_cm, ubicacion, estado) VALUES (?, ?, ?, 'Bodega Principal', 'Disponible')`, [id_vidrio, retazoA_ancho, plancha.alto_estandar_cm]);
                    mermas_guardadas++;
                }
                if (ancho_solicitado >= 20 && retazoB_alto >= 20) {
                    await db.query(`INSERT INTO retazos (id_vidrio, ancho_cm, alto_cm, ubicacion, estado) VALUES (?, ?, ?, 'Bodega Principal', 'Disponible')`, [id_vidrio, ancho_solicitado, retazoB_alto]);
                    mermas_guardadas++;
                }
            }

            if (marcoSeleccionado !== 1) { 
                const [invMarcoRows] = await db.query(
                    'SELECT id_inventario_marco FROM inventario_marcos WHERE id_marco = ? LIMIT 1', 
                    [marcoSeleccionado]
                );

                if (invMarcoRows.length > 0) {
                    const idInvMarcoReal = invMarcoRows[0].id_inventario_marco;
                    await db.query('UPDATE inventario_marcos SET cantidad_stock = cantidad_stock - 1 WHERE id_inventario_marco = ?', [idInvMarcoReal]);
                    await db.query(`INSERT INTO movimientos_inventario (id_inventario_marco, id_usuario, tipo_movimiento, cantidad, motivo, fecha_movimiento) 
                                    VALUES (?, ?, 'Salida', 1, 'Consumo por venta (Marco)', NOW())`, 
                                    [idInvMarcoReal, id_usuario]);
                } else {
                    console.warn(`No se encontró stock de inventario para el marco ID: ${marcoSeleccionado}`);
                }
            }

            // Guardado final
            const [insertCotizacion] = await db.query(`INSERT INTO cotizaciones (id_usuario, nombre_cliente, total_calculado, estado, fecha_emision) VALUES (?, ?, ?, ?, NOW())`, 
            [id_usuario, nombre_cliente || null, subtotal, estado_boleta]);

            id_cotizacion_generada = insertCotizacion.insertId;

            await db.query(`INSERT INTO detalles_cotizacion (id_cotizacion, id_vidrio, id_marco, id_retazo_usado, ancho_solicitado_cm, alto_solicitado_cm, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [id_cotizacion_generada, id_vidrio, marcoSeleccionado, id_retazo_usado, ancho_solicitado, alto_solicitado, subtotal]);
        }

        res.json({
            success: true,
            id_cotizacion: id_cotizacion_generada,
            total: subtotal.toFixed(2),
            estado: estado_boleta,
            notificacion_sistema: mensaje_optimizacion,
            retazos_generados: mermas_guardadas > 0 ? `Se guardaron ${mermas_guardadas} mermas.` : ""
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al procesar." });
    }
};

// Historial y Estado
exports.obtenerHistorial = async (req, res) => {
    try {
        const [cotizaciones] = await db.query(`
            SELECT c.id_cotizacion, c.nombre_cliente, c.fecha_emision, c.total_calculado, c.estado,
                   d.ancho_solicitado_cm, d.alto_solicitado_cm, v.nombre as tipo_vidrio
            FROM cotizaciones c
            JOIN detalles_cotizacion d ON c.id_cotizacion = d.id_cotizacion
            JOIN tipos_vidrio v ON d.id_vidrio = v.id_vidrio
            ORDER BY c.fecha_emision DESC
        `);
        res.json(cotizaciones);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error en el servidor al cargar historial." });
    }
};

exports.actualizarEstado = async (req, res) => {
    const { id_cotizacion } = req.params;
    const { estado } = req.body;
    try {
        await db.query('UPDATE cotizaciones SET estado = ? WHERE id_cotizacion = ?', [estado, id_cotizacion]);
        res.json({ success: true, mensaje: "Estado actualizado correctamente." });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ error: "Error al actualizar el estado." });
    }
};

// ==========================================
// NUEVO: GENERACIÓN DE PDF CORPORATIVO
// ==========================================
exports.descargarCotizacionPDF = async (req, res) => {
    const { id } = req.params;

    try {
        // Consultamos la BD
        const [cotizacionRows] = await db.query(`
            SELECT c.id_cotizacion, c.nombre_cliente, c.fecha_emision, c.total_calculado, c.estado,
                   d.ancho_solicitado_cm, d.alto_solicitado_cm, v.nombre as tipo_vidrio
            FROM cotizaciones c
            JOIN detalles_cotizacion d ON c.id_cotizacion = d.id_cotizacion
            JOIN tipos_vidrio v ON d.id_vidrio = v.id_vidrio
            WHERE c.id_cotizacion = ?
        `, [id]);

        if (cotizacionRows.length === 0) {
            return res.status(404).json({ error: "Cotización no encontrada" });
        }

        const orden = cotizacionRows[0];

        // Configuración de la cabecera para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Orden_${orden.id_cotizacion}_LAMM.pdf`);

        // Iniciar documento
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // DISEÑO DEL PDF 

        // 1. Agregar el Logotipo
        try {
            const logoPath = path.join(__dirname, '../assets/logo-empresa.jpg'); 
            doc.image(logoPath, 50, 45, { width: 80 }); 
        } catch (err) {
            console.warn("No se encontró el logo en la ruta especificada.");
        }

        // 2. Nombre de la Empresa y Subtítulo
        doc.fillColor('#000000') 
           .fontSize(26)
           .text('Vidriería LAMM', 50, 50, { align: 'center', width: 512 })
           .fontSize(12)
           .fillColor('#666666')
           .text('Documento de Orden y Cotización', 50, 80, { align: 'center', width: 512 });
        
        doc.moveDown(3);
        
        // Datos de la orden
        doc.fillColor('#000000').fontSize(14).text('Detalles del Cliente', 50, doc.y, { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Cliente: ${orden.nombre_cliente || 'Sin nombre registrado'}`);
        doc.text(`Fecha de Emisión: ${new Date(orden.fecha_emision).toLocaleDateString('es-CL')}`);
        doc.text(`N° de Orden: #${orden.id_cotizacion}`);
        doc.text(`Estado Actual: ${orden.estado}`);

        doc.moveDown(2);

        // Detalle técnico 
        doc.fontSize(14).text('Especificaciones de Corte', { underline: true });
        doc.moveDown(1);
        doc.rect(50, doc.y, 500, 60).stroke(); 
        
        // Texto dentro de la caja
        doc.fontSize(12).text(`Material Solicitado: ${orden.tipo_vidrio}`, 60, doc.y + 15);
        doc.text(`Dimensiones: ${orden.ancho_solicitado_cm} cm x ${orden.alto_solicitado_cm} cm`, 60, doc.y + 15);

        doc.moveDown(4);

        // 3. Precio Final
        doc.fontSize(18)
           .fillColor('#000000') 
           .text(`Total a Pagar: $${orden.total_calculado}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).send("Error interno al procesar el documento PDF.");
    }
};