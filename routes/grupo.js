const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupo.controller');
const upload = require('../middlewares/upload');
const UsuarioController = require('../controllers/usuario.controller');

router.post('/grupo', UsuarioController.verificarToken, upload.single('foto'), grupoController.crearGrupo);
router.get('/grupos', grupoController.obtenerGrupos);
router.get('/grupo/:id', grupoController.obtenerGrupoPorId);
router.get('/grupos/usuario/:usuarioId', grupoController.obtenerGruposPorUsuario);

router.post('/invitar', UsuarioController.verificarToken, grupoController.invitarUsuario);

// Galería del grupo
router.post('/grupo/:id/galeria', UsuarioController.verificarToken, upload.array('fotos', 10), grupoController.agregarFotosGaleria);
router.delete('/grupo/:id/galeria/:index', UsuarioController.verificarToken, grupoController.eliminarFotoGaleria);

// Gestión de grupo
router.put('/grupo/:id', UsuarioController.verificarToken, upload.single('foto'), grupoController.actualizarGrupo);
router.delete('/grupo/:id', UsuarioController.verificarToken, grupoController.eliminarGrupo);
router.delete('/grupo/:id/integrante/:usuarioId', UsuarioController.verificarToken, grupoController.removerIntegrante);

// Unirse y Solicitudes
router.post('/grupo/:id/unirse', UsuarioController.verificarToken, grupoController.unirseGrupo);
router.post('/grupo/:id/solicitud/:usuarioId', UsuarioController.verificarToken, grupoController.gestionarSolicitud);

module.exports = router;



