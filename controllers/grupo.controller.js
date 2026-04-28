const Grupo = require('../models/grupo.model');
const mongoose = require("mongoose");

// Crear un grupo
exports.crearGrupo = async (req, res) => {
  try {
    console.log("📩 Datos recibidos:", req.body);
    const { nombre, descripcion, integrantes } = req.body;

    // Asegurar que los integrantes sean ObjectId válidos
    const integrantesObjectIds = integrantes.map(id => new mongoose.Types.ObjectId(id));

    const nuevoGrupo = new Grupo({
      nombre,
      descripcion,
      integrantes: integrantesObjectIds
    });

    await nuevoGrupo.save();
    res.status(201).json({ message: "Grupo creado exitosamente", grupo: nuevoGrupo });

  } catch (error) {
    console.error("Error al crear el grupo:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Obtener todos los grupos
exports.obtenerGrupos = async (req, res) => {
  try {
    const grupos = await Grupo.find().populate('integrantes');
    res.status(200).json(grupos);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener grupos', error: err });
  }
};

// Invitar a un usuario al grupo
exports.invitarUsuario = async (req, res) => {
  try {
    const { grupoId, usuarioId } = req.body;
    const grupo = await Grupo.findById(grupoId);
    grupo.integrantes.push(usuarioId);
    await grupo.save();
    res.status(200).json(grupo);
  } catch (err) {
    res.status(400).json({ message: 'Error al invitar usuario', error: err });
  }
};

// Obtener grupos donde el usuario es integrante
exports.obtenerGruposPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const grupos = await Grupo.find({ integrantes: usuarioId }).populate('integrantes', 'nombre apellidos avatar');
    res.status(200).json(grupos);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener grupos del usuario', error: err });
  }
};
