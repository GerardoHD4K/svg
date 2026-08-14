const express = require('express');
const router = express.Router();
const cotizacionesController = require('../controllers/cotizaciones.controller');


// Ruta para procesar y crear una cotización/venta
router.post('/calcular', cotizacionesController.procesarCotizacion);
router.get('/historial', cotizacionesController.obtenerHistorial);
router.put('/:id_cotizacion/estado', cotizacionesController.actualizarEstado);
router.get('/:id/pdf', cotizacionesController.descargarCotizacionPDF);

module.exports = router;