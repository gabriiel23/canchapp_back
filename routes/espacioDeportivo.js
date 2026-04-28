const express = require("express");
const { 
  crearEspacioDeportivo, 
  editarEspacioDeportivo, 
  obtenerEspaciosDeportivos,
  obtenerEspacioPorId,
  obtenerEspaciosPorPropietario,
  agregarImagenGaleria,
  eliminarImagenGaleria,
  eliminarEspacioDeportivo,
  agregarCuentaBancaria,
  editarCuentaBancaria,
  eliminarCuentaBancaria
} = require("../controllers/espacioDeportivo.controller");

const UsuarioController = require('../controllers/usuario.controller');

const router = express.Router();

// Crear un espacio deportivo con imagen y galería
router.post("/espacio-deportivo", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, crearEspacioDeportivo);

// Editar un espacio deportivo
router.put("/espacio-deportivo/:id", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, editarEspacioDeportivo);

// Eliminar un espacio deportivo
router.delete("/espacio-deportivo/:id", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, eliminarEspacioDeportivo);

// Obtener un espacio deportivo por ID
router.get("/espacio-deportivo/:id", obtenerEspacioPorId);

// Obtener todos los espacios deportivos
router.get("/espacios-deportivos", obtenerEspaciosDeportivos);

// Obtener espacios por propietario
router.get("/espacios-deportivos/:propietarioId", obtenerEspaciosPorPropietario);

// Galería
router.post("/espacio-deportivo/:id/galeria", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, agregarImagenGaleria);
router.delete("/espacio-deportivo/:id/galeria", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, eliminarImagenGaleria);

// Cuentas Bancarias
router.post("/espacio-deportivo/:id/cuentas-bancarias", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, agregarCuentaBancaria);
router.put("/espacio-deportivo/:id/cuentas-bancarias/:cuentaId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, editarCuentaBancaria);
router.delete("/espacio-deportivo/:id/cuentas-bancarias/:cuentaId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, eliminarCuentaBancaria);

module.exports = router;
