const mongoose = require("mongoose");

const EspacioDeportivoSchema = new mongoose.Schema({
  nombre: String,
  ubicacion: String, // Antes 'direccion'
  descripcion: String,
  imagen: String, // Foto de portada
  galeria: {
    type: [String], // Array de URLs de imágenes (Cloudinary)
    validate: [arr => arr.length <= 10, 'La galería no puede tener más de 10 imágenes']
  },
  propietario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
  servicios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Servicio" }],
  cuentasBancarias: [
    {
      banco: { type: String, required: true },
      titular: { type: String, required: true },
      numeroCuenta: { type: String, required: true },
      cedula: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model("EspacioDeportivo", EspacioDeportivoSchema);
