const Servicio = require("../models/servicio.model");
const EspacioDeportivo = require("../models/espacio_deportivo.model");
const { upload } = require("../config/cloudinary");

// Agregar un servicio a un espacio deportivo con horarios incluidos
const agregarServicio = async (req, res) => {
  try {
    const { espacioId } = req.params;
    const { nombre, tipo, horarios, microservicios, diasAbierto, precioDia, precioNoche, horaInicioNoche } = req.body;
    const imagen = req.file ? req.file.path : null; // Obtener la URL de Cloudinary

    if (!nombre || !tipo) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios (nombre o tipo)" });
    }

    const espacio = await EspacioDeportivo.findById(espacioId);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }
    
    let parsedHorarios = [];
    if (typeof horarios === 'string') {
      try {
        parsedHorarios = JSON.parse(horarios);
      } catch (error) {
        return res.status(400).json({ mensaje: "Formato de horarios inválido", error: error.message });
      }
    } else if (Array.isArray(horarios)) {
      parsedHorarios = horarios;
    } else {
      return res.status(400).json({ mensaje: "Horarios debe ser un arreglo de objetos o un JSON válido" });
    }

    for (const horario of parsedHorarios) {
      if (
        typeof horario.inicio !== 'string' ||
        typeof horario.fin !== 'string' ||
        typeof horario.precio !== 'number' ||
        typeof horario.disponible !== 'boolean'
      ) {
        return res.status(400).json({ mensaje: "Estructura de horarios inválida" });
      }
    }

    // Parsear campos complejos que vienen como string
    let parsedMicroservicios = [];
    if (microservicios) parsedMicroservicios = typeof microservicios === 'string' ? JSON.parse(microservicios) : microservicios;
    
    let parsedDiasAbierto = [];
    if (diasAbierto) parsedDiasAbierto = typeof diasAbierto === 'string' ? JSON.parse(diasAbierto) : diasAbierto;

    const nuevoServicio = new Servicio({
      espacio: espacioId,
      nombre,
      tipo,
      imagen,
      horarios: parsedHorarios,
      microservicios: parsedMicroservicios,
      diasAbierto: parsedDiasAbierto,
      precioDia: precioDia ? Number(precioDia) : null,
      precioNoche: precioNoche ? Number(precioNoche) : null,
      horaInicioNoche: horaInicioNoche || null
    });
    await nuevoServicio.save();

    espacio.servicios.push(nuevoServicio._id);
    await espacio.save();

    res.status(201).json(nuevoServicio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al agregar servicio", error: error.message || error });
  }
};

// Actualizar un servicio existente
const actualizarServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const { nombre, tipo, horarios, microservicios, diasAbierto, precioDia, precioNoche, horaInicioNoche } = req.body;
    const imagen = req.file ? req.file.path : null;

    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    if (nombre) servicio.nombre = nombre;
    if (tipo) servicio.tipo = tipo;
    if (horarios) {
      servicio.horarios = typeof horarios === 'string' ? JSON.parse(horarios) : horarios;
    }
    if (imagen) servicio.imagen = imagen;
    if (microservicios) servicio.microservicios = typeof microservicios === 'string' ? JSON.parse(microservicios) : microservicios;
    if (diasAbierto) servicio.diasAbierto = typeof diasAbierto === 'string' ? JSON.parse(diasAbierto) : diasAbierto;
    if (precioDia !== undefined) servicio.precioDia = Number(precioDia);
    if (precioNoche !== undefined) servicio.precioNoche = Number(precioNoche);
    if (horaInicioNoche !== undefined) servicio.horaInicioNoche = horaInicioNoche;

    await servicio.save();
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar servicio", error });
  }
};

// Obtener todos los servicios de un espacio deportivo
const obtenerServiciosDeEspacio = async (req, res) => {
  try {
    const { espacioId } = req.params;
    const servicios = await Servicio.find({ espacio: espacioId });
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los servicios", error });
  }
};

// Obtener los horarios de un servicio específico
const obtenerHorariosDeServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }
    res.json(servicio.horarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los horarios del servicio", error: error.message });
  }
};

// Eliminar un servicio
const eliminarServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    // Quitar referencia del espacio deportivo
    const EspacioDeportivo = require("../models/espacio_deportivo.model");
    await EspacioDeportivo.findByIdAndUpdate(servicio.espacio, {
      $pull: { servicios: servicioId }
    });

    await Servicio.findByIdAndDelete(servicioId);
    res.json({ mensaje: "Servicio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el servicio", error: error.message });
  }
};

// Gestionar bloqueos de horas por fecha (reservas físicas, mantenimiento, etc.)
// Body: { fecha: "YYYY-MM-DD", horasBloqueadas: ["15:00", "16:00"] }
const gestionarBloqueosPorFecha = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const { fecha, horasBloqueadas } = req.body;

    if (!fecha) return res.status(400).json({ mensaje: 'Se requiere el campo fecha (YYYY-MM-DD).' });

    const servicio = await Servicio.findById(servicioId);
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });

    // Buscar si ya existe un bloqueo para esa fecha
    const idx = servicio.bloquesPorFecha.findIndex(b => b.fecha === fecha);
    if (idx >= 0) {
      // Actualizar
      if (!horasBloqueadas || horasBloqueadas.length === 0) {
        // Quitar bloqueo de esa fecha
        servicio.bloquesPorFecha.splice(idx, 1);
      } else {
        servicio.bloquesPorFecha[idx].horasBloqueadas = horasBloqueadas;
      }
    } else if (horasBloqueadas && horasBloqueadas.length > 0) {
      servicio.bloquesPorFecha.push({ fecha, horasBloqueadas });
    }

    await servicio.save();
    res.json({ mensaje: 'Bloqueos actualizados.', bloquesPorFecha: servicio.bloquesPorFecha });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al gestionar bloqueos.', error: error.message });
  }
};

// Obtener horas bloqueadas manualmente para una fecha específica
const obtenerBloqueosDeFecha = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: 'Se requiere fecha.' });

    const servicio = await Servicio.findById(servicioId).select('bloquesPorFecha');
    if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });

    const bloqueo = servicio.bloquesPorFecha.find(b => b.fecha === fecha);
    res.json({ horasBloqueadas: bloqueo?.horasBloqueadas ?? [] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener bloqueos.', error: error.message });
  }
};

module.exports = { 
  agregarServicio: [upload.single("imagen"), agregarServicio], 
  actualizarServicio: [upload.single("imagen"), actualizarServicio],
  obtenerServiciosDeEspacio,
  obtenerHorariosDeServicio,
  eliminarServicio,
  gestionarBloqueosPorFecha,
  obtenerBloqueosDeFecha,
};
