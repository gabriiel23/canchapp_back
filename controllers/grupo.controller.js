const Grupo = require('../models/grupo.model');
const mongoose = require("mongoose");

// Crear un grupo
exports.crearGrupo = async (req, res) => {
  try {
    console.log("📩 Datos recibidos:", req.body);
    let { nombre, descripcion, integrantes, privacidad, admin } = req.body;

    // Si admin no viene en el body, usar el del token
    if (!admin && req.usuario) {
      admin = req.usuario.id;
    }

    // Manejar la foto si se subió
    const fotoUrl = req.file ? req.file.path : null;

    // Parsear integrantes si vienen como string (form-data)
    let integrantesObjectIds = [];
    if (integrantes) {
      const parsedIntegrantes = typeof integrantes === 'string' ? JSON.parse(integrantes) : integrantes;
      integrantesObjectIds = parsedIntegrantes.map(id => new mongoose.Types.ObjectId(id));
    }

    // El admin siempre es parte del grupo
    if (admin && !integrantesObjectIds.includes(admin)) {
      integrantesObjectIds.push(new mongoose.Types.ObjectId(admin));
    }

    const nuevoGrupo = new Grupo({
      nombre,
      descripcion,
      foto: fotoUrl,
      privacidad: privacidad || "publico",
      admin,
      integrantes: integrantesObjectIds
    });

    await nuevoGrupo.save();
    res.status(201).json({ message: "Grupo creado exitosamente", grupo: nuevoGrupo });

  } catch (error) {
    console.error("Error al crear el grupo:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
};

// Obtener todos los grupos
exports.obtenerGrupos = async (req, res) => {
  try {
    const grupos = await Grupo.find()
      .populate('integrantes', 'nombre apellidos avatar')
      .populate('admin', 'nombre apellidos avatar')
      .populate('solicitudes', 'nombre apellidos avatar');
    res.status(200).json(grupos);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener grupos', error: err });
  }
};

// Obtener un grupo por ID
exports.obtenerGrupoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await Grupo.findById(id)
      .populate('integrantes', 'nombre apellidos avatar')
      .populate('admin', 'nombre apellidos avatar')
      .populate('solicitudes', 'nombre apellidos avatar');
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });
    res.status(200).json(grupo);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener el grupo', error: err });
  }
};
// Unirse a un grupo o enviar solicitud
exports.unirseGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    // Verificar si ya es integrante
    if (grupo.integrantes.includes(usuarioId)) {
      return res.status(400).json({ message: "Ya eres miembro de este grupo" });
    }

    if (grupo.privacidad === 'publico') {
      grupo.integrantes.push(usuarioId);
      await grupo.save();
      return res.status(200).json({ message: "Te has unido al grupo correctamente", joined: true });
    } else {
      // Es privado, enviar solicitud
      if (grupo.solicitudes.includes(usuarioId)) {
        return res.status(400).json({ message: "Ya has enviado una solicitud a este grupo" });
      }
      grupo.solicitudes.push(usuarioId);
      await grupo.save();
      return res.status(200).json({ message: "Solicitud enviada al administrador", joined: false });
    }
  } catch (err) {
    res.status(400).json({ message: 'Error al procesar la unión', error: err });
  }
};

// Aceptar o rechazar solicitud (Admin)
exports.gestionarSolicitud = async (req, res) => {
  try {
    const { id, usuarioId } = req.params;
    const { accion } = req.body; // 'aceptar' o 'rechazar'
    const adminId = req.usuario.id;

    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    if (grupo.admin.toString() !== adminId) {
      return res.status(403).json({ message: "No tienes permiso para gestionar solicitudes" });
    }

    // Quitar de solicitudes
    grupo.solicitudes = grupo.solicitudes.filter(s => s.toString() !== usuarioId);

    if (accion === 'aceptar') {
      if (!grupo.integrantes.includes(usuarioId)) {
        grupo.integrantes.push(usuarioId);
      }
    }

    await grupo.save();
    res.status(200).json({ message: `Solicitud ${accion}ada correctamente` });
  } catch (err) {
    res.status(400).json({ message: 'Error al gestionar solicitud', error: err });
  }
};

// Invitar a un usuario al grupo
exports.invitarUsuario = async (req, res) => {
  try {
    const { grupoId, usuarioId } = req.body;
    const grupo = await Grupo.findById(grupoId);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });
    
    if (!grupo.integrantes.includes(usuarioId)) {
      grupo.integrantes.push(usuarioId);
      await grupo.save();
    }
    res.status(200).json(grupo);
  } catch (err) {
    res.status(400).json({ message: 'Error al invitar usuario', error: err });
  }
};

// Obtener grupos donde el usuario es integrante
exports.obtenerGruposPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const grupos = await Grupo.find({ integrantes: usuarioId })
      .populate('integrantes', 'nombre apellidos avatar')
      .populate('admin', 'nombre apellidos avatar');
    res.status(200).json(grupos);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener grupos del usuario', error: err });
  }
};

// Agregar fotos a la galería del grupo
exports.agregarFotosGaleria = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No se subieron archivos" });
    }

    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    // Verificar que sea el admin
    if (req.usuario.id !== grupo.admin.toString()) {
      return res.status(403).json({ message: "Solo el administrador puede agregar fotos" });
    }

    const nuevasFotos = req.files.map(file => file.path);
    grupo.galeria.push(...nuevasFotos);
    await grupo.save();

    res.status(200).json({ message: "Fotos agregadas", galeria: grupo.galeria });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar fotos", error: error.message });
  }
};

// Eliminar foto de la galería
exports.eliminarFotoGaleria = async (req, res) => {
  try {
    const { id, index } = req.params;
    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    if (req.usuario.id !== grupo.admin.toString()) {
      return res.status(403).json({ message: "Solo el administrador puede eliminar fotos" });
    }

    grupo.galeria.splice(index, 1);
    await grupo.save();

    res.status(200).json({ message: "Foto eliminada", galeria: grupo.galeria });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar foto", error: error.message });
  }
};

// Actualizar un grupo
exports.actualizarGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, privacidad } = req.body;

    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    // Verificar que sea el admin
    if (req.usuario.id !== grupo.admin.toString()) {
      return res.status(403).json({ message: "Solo el administrador puede editar el grupo" });
    }

    if (nombre) grupo.nombre = nombre;
    if (descripcion) grupo.descripcion = descripcion;
    if (privacidad) grupo.privacidad = privacidad;
    
    // Si se subió una nueva foto
    if (req.file) {
      grupo.foto = req.file.path;
    }

    await grupo.save();
    res.status(200).json({ message: "Grupo actualizado", grupo });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar grupo", error: error.message });
  }
};

// Eliminar un grupo
exports.eliminarGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    if (req.usuario.id !== grupo.admin.toString()) {
      return res.status(403).json({ message: "Solo el administrador puede eliminar el grupo" });
    }

    await Grupo.findByIdAndDelete(id);
    res.status(200).json({ message: "Grupo eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar grupo", error: error.message });
  }
};

// Remover un integrante del grupo
exports.removerIntegrante = async (req, res) => {
  try {
    const { id, usuarioId } = req.params;
    const grupo = await Grupo.findById(id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    // Solo el admin o el propio usuario pueden sacarlo del grupo
    if (req.usuario.id !== grupo.admin.toString() && req.usuario.id !== usuarioId) {
      return res.status(403).json({ message: "No tienes permiso para realizar esta acción" });
    }

    // No permitir que el admin se remueva a sí mismo (debe borrar el grupo o ceder admin)
    if (usuarioId === grupo.admin.toString()) {
      return res.status(400).json({ message: "El administrador no puede abandonar el grupo directamente" });
    }

    grupo.integrantes = grupo.integrantes.filter(m => m.toString() !== usuarioId);
    await grupo.save();

    res.status(200).json({ message: "Usuario removido del grupo", integrantes: grupo.integrantes });
  } catch (error) {
    res.status(500).json({ message: "Error al remover integrante", error: error.message });
  }
};



