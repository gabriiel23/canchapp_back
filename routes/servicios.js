const express = require("express");
const router = express.Router();
const { 
  agregarServicio, 
  actualizarServicio, 
  obtenerServiciosDeEspacio, 
  obtenerHorariosDeServicio,
  eliminarServicio,
  gestionarBloqueosPorFecha,
  obtenerBloqueosDeFecha,
} = require("../controllers/servicio.controller");

const UsuarioController = require('../controllers/usuario.controller');

// Agregar un servicio a un espacio deportivo
router.post("/:espacioId", agregarServicio);

// Actualizar un servicio
router.put("/:servicioId", actualizarServicio);

// Eliminar un servicio
router.delete("/:servicioId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, eliminarServicio);

// Obtener todos los servicios de un espacio deportivo
router.get("/:espacioId", obtenerServiciosDeEspacio);
router.get("/:servicioId/horarios", obtenerHorariosDeServicio);

// Gestionar bloqueos manuales por fecha (POST crea/actualiza, GET consulta)
router.post("/:servicioId/bloqueos", UsuarioController.verificarToken, gestionarBloqueosPorFecha);
router.get("/:servicioId/bloqueos", obtenerBloqueosDeFecha);

module.exports = router;
