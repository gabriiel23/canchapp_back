const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitacionSchema = new Schema({
  tipo: { type: String, enum: ['jugador', 'equipo'], required: true }, // Tipo de invitado (jugador o equipo)
  reserva: { type: Schema.Types.ObjectId, ref: 'Reserva', required: false }, // Solo se llena si la invitación está asociada a una reserva
  desafio: { type: String, required: false }, // Mensaje si la invitación es un desafío sin reserva
  invitante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }, // Usuario que envía la invitación
  invitado: { type: Schema.Types.ObjectId, refPath: 'tipo', required: true }, // Jugador o equipo al que se invita
  estado: { type: String, enum: ['pendiente', 'aceptado', 'rechazado'], default: 'pendiente' },
  fechaEnvio: { type: Date, default: Date.now },
});

const Invitacion = mongoose.model('Invitacion', invitacionSchema);
module.exports = Invitacion;
