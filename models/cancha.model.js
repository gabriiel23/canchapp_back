const mongoose = require('mongoose');

// Crear el esquema de Cancha
const CanchaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  imagenes: {
    type: [String],
    default: [],
  },
  descripcion: {
    type: String,
    required: true,
  },
  disponible: {
    type: Boolean,
    default: true,
  },
  calificacion: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  servicio: {
    type: String,
    required: true,
    enum: ['sintética', 'básquet', 'vóley', 'fútbol', 'tenis', 'piscina', 'otros'], // Valores permitidos
  },
});

// Crear el modelo de Cancha
const Cancha = mongoose.model('Cancha', CanchaSchema);

module.exports = Cancha;