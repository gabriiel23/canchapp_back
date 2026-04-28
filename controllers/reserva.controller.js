const Reserva = require("../models/reserva.model");
const Servicio = require("../models/servicio.model");
const moment = require("moment");
const { upload } = require("../config/cloudinary");

// Crear una reserva
exports.crearReserva = async (req, res) => {
  try {
    const { usuario, servicio, espacio, fecha, hora } = req.body;

    if (!usuario || !servicio || !espacio || !fecha || !hora) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios (usuario, servicio, espacio, fecha u hora).",
      });
    }

    // Verificar que no existe ya una reserva confirmada/pendiente para ese slot
    const reservaExistente = await Reserva.findOne({
      servicio,
      fecha,
      hora,
      estado: { $in: ["Pendiente", "EsperandoValidacion", "Confirmada"] },
    });

    if (reservaExistente) {
      return res.status(400).json({ mensaje: "Ese horario ya está reservado." });
    }

    const nuevaReserva = new Reserva({ usuario, servicio, espacio, fecha, hora });
    await nuevaReserva.save();

    res.status(201).json({ mensaje: "Reserva creada con éxito", reserva: nuevaReserva });
  } catch (err) {
    console.error("Error al crear reserva:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ mensaje: "Error de validación", detalles: err.errors });
    }
    if (err.code === 11000) {
      return res.status(400).json({ mensaje: "Ya existe una reserva en ese horario." });
    }
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Crear reserva PRESENCIAL (por admin — cliente llega físicamente)
exports.crearReservaPresencial = async (req, res) => {
  try {
    const { usuario, servicio, espacio, fecha, hora, nombreCliente, metodoPago } = req.body;

    if (!usuario || !servicio || !espacio || !fecha || !hora) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios." });
    }
    if (!nombreCliente || nombreCliente.trim() === '') {
      return res.status(400).json({ mensaje: "El nombre del cliente es obligatorio para reservas presenciales." });
    }

    // Verificar disponibilidad
    const reservaExistente = await Reserva.findOne({
      servicio, fecha, hora,
      estado: { $in: ["Pendiente", "EsperandoValidacion", "Confirmada"] },
    });
    if (reservaExistente) {
      return res.status(400).json({ mensaje: "Ese horario ya está reservado." });
    }

    const nuevaReserva = new Reserva({
      usuario,
      servicio,
      espacio,
      fecha,
      hora,
      nombreCliente: nombreCliente.trim(),
      metodoPago: metodoPago || "Efectivo",
      estado: "Confirmada",      // Las presenciales se confirman directamente
      creadoPorAdmin: true,
    });
    await nuevaReserva.save();

    res.status(201).json({ mensaje: "Reserva presencial creada", reserva: nuevaReserva });
  } catch (err) {
    console.error("Error al crear reserva presencial:", err);
    if (err.code === 11000) {
      return res.status(400).json({ mensaje: "Ya existe una reserva en ese horario." });
    }
    res.status(500).json({ mensaje: "Error interno", error: err.message });
  }
};



// Obtener reservas de un usuario
exports.obtenerReservas = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      return res.status(400).json({ mensaje: "El ID de usuario es obligatorio." });
    }

    await actualizarReservasExpiradas();

    const reservas = await Reserva.find({ usuario: usuarioId })
      .populate("usuario", "nombre")
      .populate("servicio", "nombre")
      .populate("espacio", "nombre imagen cuentasBancarias");

    if (reservas.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron reservas." });
    }

    res.status(200).json(reservas);
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Obtener reservas por servicio
exports.obtenerReservasPorServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;

    if (!servicioId) {
      return res.status(400).json({ mensaje: "El ID del servicio es obligatorio." });
    }

    await actualizarReservasExpiradas();

    const reservas = await Reserva.find({ servicio: servicioId })
      .populate("usuario", "nombre")
      .populate("servicio", "nombre")
      .populate("espacio", "nombre");

    if (reservas.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron reservas para este servicio." });
    }

    res.status(200).json(reservas);
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Obtener reservas por espacio
exports.obtenerReservasPorEspacio = async (req, res) => {
  try {
    const { espacioId } = req.params;

    if (!espacioId) {
      return res.status(400).json({ mensaje: "El ID del espacio es obligatorio." });
    }

    await actualizarReservasExpiradas();

    const reservas = await Reserva.find({ espacio: espacioId })
      .populate("usuario", "nombre")
      .populate("servicio", "nombre")
      .populate("espacio", "nombre");

    if (reservas.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron reservas para este espacio." });
    }

    res.status(200).json(reservas);
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Obtener horarios OCUPADOS de un servicio para una fecha específica
// Incluye: reservas activas + bloqueos manuales del admin
exports.obtenerHorariosOcupados = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ mensaje: "Se requiere el parámetro 'fecha' (YYYY-MM-DD)." });
    }

    // 1. Horas ocupadas por reservas activas
    const reservas = await Reserva.find({
      servicio: servicioId,
      fecha,
      estado: { $in: ["Pendiente", "EsperandoValidacion", "Confirmada"] },
    }).select("hora");
    const horasReservadas = reservas.map((r) => r.hora);

    // 2. Horas bloqueadas manualmente por el admin
    const Servicio = require("../models/servicio.model");
    const servicio = await Servicio.findById(servicioId).select("bloquesPorFecha");
    const bloqueoFecha = servicio?.bloquesPorFecha?.find((b) => b.fecha === fecha);
    const horasBloqueadas = bloqueoFecha?.horasBloqueadas ?? [];

    // Unión sin duplicados
    const todas = [...new Set([...horasReservadas, ...horasBloqueadas])];
    res.status(200).json({ horasOcupadas: todas });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};


// Actualizar el estado de una reserva
exports.actualizarEstadoReserva = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ["Pendiente", "EsperandoValidacion", "Confirmada", "Cancelada", "Terminada"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ mensaje: "Estado no válido" });
    }

    const reservaActualizada = await Reserva.findByIdAndUpdate(
      reservaId,
      { estado },
      { new: true }
    );

    if (!reservaActualizada) {
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    res.status(200).json({ mensaje: "Estado actualizado con éxito", reserva: reservaActualizada });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Subir comprobante de pago (imagen)
exports.subirComprobante = [
  upload.single("comprobante"),
  async (req, res) => {
    try {
      const { reservaId } = req.params;

      if (!req.file) {
        return res.status(400).json({ mensaje: "No se recibió ninguna imagen." });
      }

      const comprobanteUrl = req.file.path;

      const reserva = await Reserva.findByIdAndUpdate(
        reservaId,
        { comprobanteUrl, estado: "EsperandoValidacion", metodoPago: "Transferencia" },
        { new: true }
      );

      if (!reserva) {
        return res.status(404).json({ mensaje: "Reserva no encontrada." });
      }

      res.status(200).json({ mensaje: "Comprobante subido con éxito. En espera de validación.", reserva });
    } catch (err) {
      res.status(500).json({ mensaje: "Error al subir comprobante", error: err.message });
    }
  },
];

// Obtener una reserva por su ID
exports.obtenerReservaPorId = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const reserva = await Reserva.findById(reservaId)
      .populate("usuario", "nombre")
      .populate("servicio", "nombre horarios")
      .populate("espacio", "nombre imagen cuentasBancarias");

    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada." });
    }

    res.status(200).json(reserva);
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Validar una reserva por código único (para el admin con QR o código manual)
exports.validarReservaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const reserva = await Reserva.findOne({ codigoReserva: codigo.toUpperCase() })
      .populate("usuario", "nombre")
      .populate("servicio", "nombre")
      .populate("espacio", "nombre");

    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada para este código." });
    }

    res.status(200).json(reserva);
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
};

// Función interna: marcar reservas pasadas como Terminadas
const actualizarReservasExpiradas = async () => {
  try {
    const hoy = moment().format("YYYY-MM-DD");
    await Reserva.updateMany(
      { fecha: { $lt: hoy }, estado: { $nin: ["Terminada", "Cancelada"] } },
      { $set: { estado: "Terminada" } }
    );
  } catch (err) {
    console.error("Error al actualizar reservas expiradas:", err);
  }
};
