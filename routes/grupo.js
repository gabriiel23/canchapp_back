const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupo.controller');

router.post('/grupo', grupoController.crearGrupo);
router.get('/grupos', grupoController.obtenerGrupos);
router.get('/grupos/usuario/:usuarioId', grupoController.obtenerGruposPorUsuario);
router.post('/invitar', grupoController.invitarUsuario);

module.exports = router;
