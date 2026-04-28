const mongoose = require("mongoose");

const servicioSchema = new mongoose.Schema({
  espacio: { type: mongoose.Schema.Types.ObjectId, ref: "EspacioDeportivo", required: true },
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ["Cancha", "Piscina", "Ecuavoley", "Otro"], required: true },
  imagen: { type: String },

  microservicios: [{ type: String }],

  // Días de la semana que abre (1=Lunes ... 7=Domingo)
  diasAbierto: [{ type: Number }],

  // Precios base
  precioDia: { type: Number },
  precioNoche: { type: Number },
  horaInicioNoche: { type: String },

  // Intervalos de horario base (configurados por el admin)
  horarios: [
    {
      inicio: { type: String, required: true },  // "07:00"
      fin:    { type: String, required: true },  // "08:00"
      precio: { type: Number, required: true },
      disponible: { type: Boolean, default: true }
    }
  ],

  // Bloqueos manuales por fecha (reservas físicas, mantenimiento, etc.)
  // Estructura: [{ fecha: "YYYY-MM-DD", horasBloqueadas: ["15:00","16:00"] }]
  bloquesPorFecha: [
    {
      fecha: { type: String, required: true },           // "YYYY-MM-DD"
      horasBloqueadas: [{ type: String }]                // ["15:00", "16:00"]
    }
  ]
});

module.exports = mongoose.model("Servicio", servicioSchema);
