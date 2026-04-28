const express = require('express');
const router = express.Router();
const JugadorController = require('../controllers/jugador.controller');
const upload = require('../middlewares/upload'); // Importar Multer

// Rutas CRUD para jugadores
router.post('/jugadores', upload.array('galeria', 6), JugadorController.crearJugador);
router.get('/jugadores', JugadorController.obtenerJugadores);
router.get('/jugadores/:id', JugadorController.obtenerJugadorPorId);
router.put('/jugadores/:id', upload.none(), JugadorController.actualizarJugador);
router.delete('/jugadores/:id', JugadorController.eliminarJugador);
router.get('/jugadores/usuario/:usuarioId', JugadorController.obtenerJugadorPorUsuarioId);

// Rutas de galería independientes
router.post('/jugadores/:id/galeria', upload.array('fotos', 6), JugadorController.agregarFotosGaleria);
router.delete('/jugadores/:id/galeria/:index', JugadorController.eliminarFotoGaleria);

module.exports = router;
