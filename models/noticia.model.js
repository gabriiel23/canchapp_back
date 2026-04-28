const mongoose = require("mongoose");

const noticiaSchema = new mongoose.Schema({
  espacio: { type: mongoose.Schema.Types.ObjectId, ref: "EspacioDeportivo", required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  imagen: { type: String }, // URL de Cloudinary
  tipo: { type: String, enum: ["noticia", "evento"], required: true },
  fechaInicio: { type: Date }, // Para eventos
  fechaFin: { type: Date },   // Para eventos de varios días (opcional)
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Noticia", noticiaSchema);
