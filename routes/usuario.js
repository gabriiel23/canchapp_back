const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuario.controller');
const upload = require('../middlewares/upload'); // Importar Multer

// Rutas de autenticación
router.post('/auth/registro', upload.single('avatar'), UsuarioController.registrarse);
router.post('/auth/login', UsuarioController.loguearse);

// Rutas protegidas con autenticación
router.get('/usuarios', UsuarioController.obtenerUsuarios);

// Ruta exclusiva para "administradores" y "superadmins"
router.get('/usuarios-protegidos', UsuarioController.verificarToken, UsuarioController.verificarAdministrador, UsuarioController.obtenerUsuarios);
router.get('/usuario/:id', UsuarioController.verificarToken, UsuarioController.obtenerUsuarioPorId);
router.put('/usuario/:id', UsuarioController.verificarToken, upload.single('avatar'), UsuarioController.actualizarUsuario);

// Ruta exclusiva para superadmins: Cambiar rol de usuario
router.put('/usuario/:id/rol', UsuarioController.verificarToken, UsuarioController.verificarSuperAdmin, UsuarioController.actualizarRolUsuario);

module.exports = router;
