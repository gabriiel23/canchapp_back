const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const reservaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
  espacio: { type: mongoose.Schema.Types.ObjectId, ref: "EspacioDeportivo", required: true },
  fecha: { type: String, required: true }, // "YYYY-MM-DD"
  hora: { type: String, required: true }, // "HH:mm"
  estado: { type: String, enum: ["Pendiente", "EsperandoValidacion", "Confirmada", "Cancelada", "Terminada"], default: "Pendiente" },
  
  // Pago
  metodoPago: { type: String, enum: ["Transferencia", "Tarjeta", "Efectivo"], default: null },
  comprobanteUrl: { type: String, default: null },

  // Para reservas presenciales (creadas por el admin)
  nombreCliente: { type: String, default: null }, // Nombre del cliente si no tiene cuenta
  creadoPorAdmin: { type: Boolean, default: false },

  // Identificación única
  codigoReserva: { type: String, unique: true, default: () => uuidv4().split("-")[0].toUpperCase() },
});

// Evita reservas duplicadas para el mismo servicio, fecha y hora
reservaSchema.index({ servicio: 1, fecha: 1, hora: 1 }, { unique: true });

// Validación antes de guardar la reserva
reservaSchema.pre("validate", async function (next) {
  try {
    const Servicio = mongoose.model("Servicio");
    const servicio = await Servicio.findById(this.servicio);

    if (!servicio) {
      return next(new Error("El servicio seleccionado no existe."));
    }

    // Solo validar horario si es una reserva nueva (no una actualización de estado)
    if (this.isNew) {
      const horarioValido = servicio.horarios.some(horario => {
        return this.hora >= horario.inicio && this.hora < horario.fin;
      });

      if (!horarioValido) {
        return next(new Error("La hora seleccionada no está dentro de los horarios disponibles del servicio."));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Reserva", reservaSchema);
