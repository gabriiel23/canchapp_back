const express = require('express');
const router = express.Router();
const invitacionController = require('../controllers/invitacion.controller');

router.post('/invitacion', invitacionController.crearInvitacion);
router.get('/:usuarioId/pendientes', invitacionController.obtenerInvitacionesPendientes);
router.put('/:invitacionId/aceptar', invitacionController.aceptarInvitacion);
router.put('/:invitacionId/rechazar', invitacionController.rechazarInvitacion);

module.exports = router;
