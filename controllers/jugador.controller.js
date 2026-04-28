const Jugador = require('../models/jugador.model');
const Usuario = require('../models/usuario.model');

// Crear un nuevo jugador asociado a un usuario
exports.crearJugador = async (req, res) => {
  try {
    let { usuario, atributos, ...datosJugador } = req.body;

    // Si atributos viene como un string (común en form-data), lo parseamos
    if (typeof atributos === 'string') {
      try {
        atributos = JSON.parse(atributos);
      } catch (e) {
        console.error("Error al parsear atributos", e);
      }
    }

    // Manejar la galería de imágenes
    let galeriaUrls = [];
    if (req.files && req.files.length > 0) {
      galeriaUrls = req.files.map(file => file.path); // Cloudinary URLs
    }

    // Verificar si el usuario existe
    const usuarioExiste = await Usuario.findById(usuario);
    if (!usuarioExiste) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const nuevoJugador = new Jugador({ 
      usuario, 
      atributos,
      galeria: galeriaUrls,
      ...datosJugador 
    });
    await nuevoJugador.save();
    res.status(201).json({ mensaje: 'Jugador creado exitosamente', jugador: nuevoJugador });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear jugador', error });
  }
};

// Obtener todos los jugadores con los datos del usuario
exports.obtenerJugadores = async (req, res) => {
  try {
    const jugadores = await Jugador.find().populate('usuario', 'nombre apellidos avatar nacionalidad telefono email');
    res.json(jugadores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener jugadores', error });
  }
};

// Obtener un jugador por ID con los datos del usuario
exports.obtenerJugadorPorId = async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id).populate('usuario', 'nombre apellidos avatar nacionalidad telefono email');
    if (!jugador) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }
    res.json(jugador);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el jugador', error });
  }
};

// Actualizar un jugador (NO modifica la galería — usar endpoints propios)
exports.actualizarJugador = async (req, res) => {
  try {
    let { usuario, atributos, ...datosJugador } = req.body;

    // Si atributos viene como un string (común en form-data), lo parseamos
    if (typeof atributos === 'string') {
      try {
        atributos = JSON.parse(atributos);
      } catch (e) {
        console.error("Error al parsear atributos en actualización", e);
      }
    }

    // Preparar objeto de actualización
    const actualizacion = { ...datosJugador };
    if (usuario) actualizacion.usuario = usuario;
    if (atributos) actualizacion.atributos = atributos;

    // La galería se maneja por sus propios endpoints (agregarFotosGaleria / eliminarFotoGaleria)
    // Al actualizar el perfil del jugador NO se modifica la galería

    if (usuario) {
      const usuarioExiste = await Usuario.findById(usuario);
      if (!usuarioExiste) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
    }

    const jugadorActualizado = await Jugador.findByIdAndUpdate(req.params.id, actualizacion, { new: true });
    if (!jugadorActualizado) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }
    res.json({ mensaje: 'Jugador actualizado exitosamente', jugador: jugadorActualizado });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar jugador', error: error.message });
  }
};

// Eliminar un jugador
exports.eliminarJugador = async (req, res) => {
  try {
    const jugadorEliminado = await Jugador.findByIdAndDelete(req.params.id);
    if (!jugadorEliminado) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }
    res.json({ mensaje: 'Jugador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar jugador', error });
  }
};

// Obtener un jugador por el ID de usuario (con todos los datos del jugador)
exports.obtenerJugadorPorUsuarioId = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'El parámetro usuarioId es obligatorio' });
    }

    if (!usuarioId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ mensaje: 'El ID de usuario no es válido' });
    }

    console.log(`Consultando jugador con usuarioId: ${usuarioId}`);

    const jugador = await Jugador.findOne({ usuario: usuarioId }).populate('usuario');

    if (!jugador) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado para este usuario' });
    }

    res.json(jugador);
  } catch (error) {
    console.error('Error al obtener el jugador:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el jugador por ID de usuario',
      error: error.message || error,
    });
  }
};

// Agregar fotos a la galería (append, no reemplaza)
exports.agregarFotosGaleria = async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id);
    if (!jugador) return res.status(404).json({ mensaje: 'Jugador no encontrado' });

    const galeriaActual = jugador.galeria || [];
    const espacioDisponible = 6 - galeriaActual.length;

    if (espacioDisponible <= 0) {
      return res.status(400).json({ mensaje: 'La galería ya está llena (máximo 6 fotos). Elimina alguna primero.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ mensaje: 'No se enviaron fotos' });
    }

    const nuevasFotos = req.files
      .slice(0, espacioDisponible)
      .map(file => file.path); // Cloudinary URLs

    jugador.galeria = [...galeriaActual, ...nuevasFotos];
    await jugador.save();

    res.json({ mensaje: 'Fotos agregadas exitosamente', jugador });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar fotos', error: error.message });
  }
};

// Eliminar una foto de la galería por índice
exports.eliminarFotoGaleria = async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id);
    if (!jugador) return res.status(404).json({ mensaje: 'Jugador no encontrado' });

    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0 || index >= (jugador.galeria || []).length) {
      return res.status(400).json({ mensaje: 'Índice de foto inválido' });
    }

    jugador.galeria.splice(index, 1);
    await jugador.save();

    res.json({ mensaje: 'Foto eliminada exitosamente', jugador });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar foto', error: error.message });
  }
};
