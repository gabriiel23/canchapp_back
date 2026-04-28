const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const UsuarioController = require('../controllers/usuario.controller');

// Crear una reserva (usuario autenticado)
router.post('/crear', UsuarioController.verificarToken, reservaController.crearReserva);

// Crear reserva presencial (admin — cliente llega físicamente)
router.post('/presencial', UsuarioController.verificarToken, reservaController.crearReservaPresencial);

// Obtener reservas de un usuario
router.get('/:usuarioId', reservaController.obtenerReservas);

// Obtener reservas por servicio
router.get("/servicio/:servicioId", reservaController.obtenerReservasPorServicio);

// Obtener reservas por espacio
router.get("/espacio/:espacioId", reservaController.obtenerReservasPorEspacio);

// Obtener horarios ocupados de un servicio en una fecha
router.get("/ocupados/:servicioId", reservaController.obtenerHorariosOcupados);

// Actualizar estado de una reserva
router.patch("/:reservaId/estado", UsuarioController.verificarToken, reservaController.actualizarEstadoReserva);

// Subir comprobante de pago
router.post("/:reservaId/comprobante", UsuarioController.verificarToken, reservaController.subirComprobante);

// Obtener una reserva por ID
router.get("/detalle/:reservaId", reservaController.obtenerReservaPorId);

// Validar reserva por código único (para admin con QR/código manual)
router.get("/validar/:codigo", reservaController.validarReservaPorCodigo);

module.exports = router;
