const mongoose = require("mongoose");

const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  integrantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }] // Referencia a Usuarios
});

const Grupo = mongoose.model("Grupo", grupoSchema);
module.exports = Grupo;
