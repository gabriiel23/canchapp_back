const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  apellidos: {
    type: String,
  },
  nacionalidad: {
    type: String,
  },
  avatar: {
    type: String, // URL de la imagen
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  telefono: {
    type: String,
    required: true,
  },
  rol: {
    type: String,
    enum: ['jugador', 'administrador', 'superadmin'],
    default: 'jugador',
    required: true,
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;