const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); 

const app = express();

app.use(cors()); 
app.use(express.json()); 

const cotizacionesRoutes = require('./routes/cotizaciones.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const authRoutes = require('./routes/auth.routes');

// RUTAS DE LA API 
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/auth', authRoutes);

// Ruta rápida para traer los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT id_usuario, nombre, rol FROM usuarios');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con la base de datos." });
    }
});

// Encendido del Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});