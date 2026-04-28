const express = require("express");
const {
  crearNoticia,
  obtenerNoticiasPorEspacio,
  editarNoticia,
  eliminarNoticia
} = require("../controllers/noticia.controller");

const UsuarioController = require('../controllers/usuario.controller');

const router = express.Router();

// Crear noticia/evento para un espacio
router.post("/noticias/:espacioId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, crearNoticia);

// Obtener noticias de un espacio (público)
router.get("/noticias/:espacioId", obtenerNoticiasPorEspacio);

// Editar noticia
router.put("/noticias/:noticiaId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, editarNoticia);

// Eliminar noticia
router.delete("/noticias/:noticiaId", UsuarioController.verificarToken, UsuarioController.verificarAdministrador, eliminarNoticia);

module.exports = router;
