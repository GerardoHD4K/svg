const db = require('../config/db');

exports.iniciarSesion = async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ error: "Por favor ingrese usuario y contraseña." });
    }

    try {
        
        const [usuarios] = await db.query(
            'SELECT id_usuario, nombre, rol FROM usuarios WHERE nombre_usuario = ? AND contrasena_hash = ? AND estado = 1', 
            [nombre_usuario, contrasena]
        );

        if (usuarios.length > 0) {
            
            res.json({ success: true, usuario: usuarios[0] });
        } else {
            res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};