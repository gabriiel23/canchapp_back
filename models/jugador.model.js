const mongoose = require('mongoose');

const JugadorSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // Referencia a Usuario
  posicion: { type: String, enum: ['Portero', 'Defensa', 'Mediocampista', 'Delantero'], required: true },
  estatura: { type: Number, required: true },
  edad: { type: Number, required: true },
  atributos: {
    // Comunes a jugadores de campo
    Tiro: { type: Number, min: 1, max: 99, default: 50 },
    Regate: { type: Number, min: 1, max: 99, default: 50 },
    Pase: { type: Number, min: 1, max: 99, default: 50 },
    Ritmo: { type: Number, min: 1, max: 99, default: 50 },
    Defensa: { type: Number, min: 1, max: 99, default: 50 },
    Físico: { type: Number, min: 1, max: 99, default: 50 },
    
    // Específicos para el Portero
    Reflejos: { type: Number, min: 1, max: 99, default: 50 },
    Saque: { type: Number, min: 1, max: 99, default: 50 },
    Manejo: { type: Number, min: 1, max: 99, default: 50 },
    Estirada: { type: Number, min: 1, max: 99, default: 50 },
    Velocidad: { type: Number, min: 1, max: 99, default: 50 },
    Posicionamiento: { type: Number, min: 1, max: 99, default: 50 }
  },
  galeria: [{ type: String }] // Arreglo de URLs de imágenes
});

const Jugador = mongoose.model('Jugador', JugadorSchema);
module.exports = Jugador;
