const Noticia = require("../models/noticia.model");
const EspacioDeportivo = require("../models/espacio_deportivo.model");
const { upload } = require("../config/cloudinary");

// Crear una noticia o evento
const crearNoticia = async (req, res) => {
  try {
    const { espacioId } = req.params;
    const { titulo, descripcion, tipo, fechaInicio, fechaFin } = req.body;
    const imagen = req.file ? req.file.path : null;

    // Verificar que el espacio existe
    const espacio = await EspacioDeportivo.findById(espacioId);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    const nuevaNoticia = new Noticia({
      espacio: espacioId,
      titulo,
      descripcion,
      imagen,
      tipo,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null
    });

    await nuevaNoticia.save();
    res.status(201).json(nuevaNoticia);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear la noticia/evento", error: error.message || error });
  }
};

// Obtener todas las noticias de un espacio
const obtenerNoticiasPorEspacio = async (req, res) => {
  try {
    const { espacioId } = req.params;
    const noticias = await Noticia.find({ espacio: espacioId }).sort({ fechaCreacion: -1 });
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las noticias", error: error.message || error });
  }
};

// Editar una noticia/evento
const editarNoticia = async (req, res) => {
  try {
    const { noticiaId } = req.params;
    const { titulo, descripcion, tipo, fechaInicio, fechaFin } = req.body;
    const imagen = req.file ? req.file.path : null;

    const noticia = await Noticia.findById(noticiaId);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada" });
    }

    if (titulo) noticia.titulo = titulo;
    if (descripcion) noticia.descripcion = descripcion;
    if (tipo) noticia.tipo = tipo;
    if (fechaInicio !== undefined) noticia.fechaInicio = fechaInicio || null;
    if (fechaFin !== undefined) noticia.fechaFin = fechaFin || null;
    if (imagen) noticia.imagen = imagen;

    await noticia.save();
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al editar la noticia", error: error.message || error });
  }
};

// Eliminar una noticia/evento
const eliminarNoticia = async (req, res) => {
  try {
    const { noticiaId } = req.params;
    const noticia = await Noticia.findByIdAndDelete(noticiaId);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada" });
    }
    res.json({ mensaje: "Noticia eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar la noticia", error: error.message || error });
  }
};

module.exports = {
  crearNoticia: [upload.single("imagen"), crearNoticia],
  obtenerNoticiasPorEspacio,
  editarNoticia: [upload.single("imagen"), editarNoticia],
  eliminarNoticia
};
