const Invitacion = require('../models/invitacion.model');
const Reserva = require('../models/reserva.model');
const Grupo = require('../models/grupo.model');

// Crear una invitación
exports.crearInvitacion = async (req, res) => {
  try {
    const { tipo, reservaId, desafio, invitanteId, invitadoId } = req.body;

    // Verificar si la invitación es para una reserva o un desafío
    let reserva = null;
    if (tipo === 'jugador' && reservaId) {
      reserva = await Reserva.findById(reservaId).populate('cancha');
    }

    const invitacion = new Invitacion({
      tipo,
      reserva: reserva ? reserva._id : null,
      desafio: desafio || null,
      invitante: invitanteId,
      invitado: invitadoId,
    });

    await invitacion.save();
    res.status(201).json(invitacion);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear invitación', error: err });
  }
};

// Obtener invitaciones pendientes para un usuario
exports.obtenerInvitacionesPendientes = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const invitaciones = await Invitacion.find({
      invitado: usuarioId,
      estado: 'pendiente',
    }).populate('invitante reserva');

    res.status(200).json(invitaciones);
  } catch (err) {
    res.status(400).json({ message: 'Error al obtener invitaciones', error: err });
  }
};

// Aceptar una invitación
exports.aceptarInvitacion = async (req, res) => {
  try {
    const { invitacionId } = req.params;
    const invitacion = await Invitacion.findById(invitacionId);

    if (!invitacion) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    invitacion.estado = 'aceptado';
    await invitacion.save();

    // Si la invitación está asociada a una reserva, actualizar el estado de la reserva
    if (invitacion.reserva) {
      const reserva = await Reserva.findById(invitacion.reserva);
      reserva.estado = 'confirmada'; // Confirmar la reserva
      await reserva.save();
    }

    res.status(200).json(invitacion);
  } catch (err) {
    res.status(400).json({ message: 'Error al aceptar invitación', error: err });
  }
};

// Rechazar una invitación
exports.rechazarInvitacion = async (req, res) => {
  try {
    const { invitacionId } = req.params;
    const invitacion = await Invitacion.findById(invitacionId);

    if (!invitacion) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    invitacion.estado = 'rechazado';
    await invitacion.save();

    res.status(200).json(invitacion);
  } catch (err) {
    res.status(400).json({ message: 'Error al rechazar invitación', error: err });
  }
};
