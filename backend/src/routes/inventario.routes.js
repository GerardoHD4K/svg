const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Rutas de solo lectura (GET)
router.get('/tipos-vidrio', inventarioController.obtenerTiposVidrio);
router.get('/planchas', inventarioController.obtenerStockPlanchas);
router.get('/retazos', inventarioController.obtenerRetazosDisponibles);
router.get('/marcos', inventarioController.obtenerTiposMarco);
router.post('/ingreso', inventarioController.registrarIngreso);
router.post('/baja', inventarioController.registrarBaja);
router.get('/general', inventarioController.obtenerInventarioGeneral);
module.exports = router;