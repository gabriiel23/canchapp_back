const mongoose = require("mongoose");

const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  foto: { type: String }, // URL de la imagen del grupo
  privacidad: { 
    type: String, 
    enum: ["publico", "privado"], 
    default: "publico" 
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  integrantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  solicitudes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }], // Usuarios que quieren unirse (privado)
  galeria: [{ type: String }], 
  fechaCreacion: { type: Date, default: Date.now }
});

const Grupo = mongoose.model("Grupo", grupoSchema);
module.exports = Grupo;

