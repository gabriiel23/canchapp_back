const EspacioDeportivo = require("../models/espacio_deportivo.model");
const Servicio = require("../models/servicio.model");
const Noticia = require("../models/noticia.model");
const { upload, cloudinary } = require("../config/cloudinary");

// Crear un espacio deportivo (un usuario solo puede tener uno)
const crearEspacioDeportivo = async (req, res) => {
  try {
    let { nombre, ubicacion, propietario, descripcion } = req.body;
    const imagen = req.files && req.files['imagen'] ? req.files['imagen'][0].path : null;
    const galeriaFiles = req.files && req.files['galeria'] ? req.files['galeria'] : [];
    const galeria = galeriaFiles.map(f => f.path);

    // Si no es superadmin, forzar a que el propietario sea el usuario autenticado
    if (req.usuario && req.usuario.rol !== 'superadmin') {
      propietario = req.usuario.id;
    } else if (!propietario && req.usuario) {
      propietario = req.usuario.id; // Fallback para superadmin si no envía propietario
    }

    // Verificar si el usuario ya tiene un espacio deportivo
    const existe = await EspacioDeportivo.findOne({ propietario });
    if (existe && (!req.usuario || req.usuario.rol !== 'superadmin')) {
      return res.status(400).json({ mensaje: "Ya tienes un espacio deportivo registrado." });
    }

    const nuevoEspacio = new EspacioDeportivo({ 
      nombre, 
      ubicacion, 
      propietario, 
      descripcion, 
      imagen,
      galeria 
    });

    await nuevoEspacio.save();
    res.status(201).json(nuevoEspacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear el espacio deportivo", error: error.message || error });
  }
};

// Editar un espacio deportivo
const editarEspacioDeportivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ubicacion, descripcion } = req.body;
    const imagen = req.files && req.files['imagen'] ? req.files['imagen'][0].path : null;

    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    // Verificar permisos: solo el propietario o un superadmin pueden editar
    if (req.usuario && espacio.propietario.toString() !== req.usuario.id && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ mensaje: "No tienes permiso para editar este espacio deportivo" });
    }

    if (nombre) espacio.nombre = nombre;
    if (ubicacion) espacio.ubicacion = ubicacion;
    if (descripcion) espacio.descripcion = descripcion;
    if (imagen) espacio.imagen = imagen;

    await espacio.save();
    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al editar el espacio deportivo", error: error.message || error });
  }
};

// Obtener todos los espacios deportivos con sus servicios y propietario
const obtenerEspaciosDeportivos = async (req, res) => {
  try {
    const espacios = await EspacioDeportivo.find()
      .populate("propietario", "nombre email")
      .populate("servicios");

    res.json(espacios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los espacios deportivos", error });
  }
};

// Obtener un espacio deportivo por ID
const obtenerEspacioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const espacio = await EspacioDeportivo.findById(id)
      .populate("propietario", "nombre email")
      .populate("servicios");

    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el espacio deportivo", error: error.message || error });
  }
};

// Obtener espacios deportivos por ID del propietario
const obtenerEspaciosPorPropietario = async (req, res) => {
  try {
    const { propietarioId } = req.params;

    const espacios = await EspacioDeportivo.find({ propietario: propietarioId })
      .populate("propietario", "nombre email")
      .populate("servicios");

    if (espacios.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron espacios deportivos para este propietario" });
    }

    res.json(espacios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los espacios deportivos", error });
  }
};

// Agregar imagen a la galería
const agregarImagenGaleria = async (req, res) => {
  try {
    const { id } = req.params;
    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    if (espacio.galeria.length >= 10) {
      return res.status(400).json({ mensaje: "La galería ya tiene el máximo de 10 imágenes" });
    }

    const imagenUrl = req.file ? req.file.path : null;
    if (!imagenUrl) {
      return res.status(400).json({ mensaje: "No se envió ninguna imagen" });
    }

    espacio.galeria.push(imagenUrl);
    await espacio.save();
    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al agregar imagen a la galería", error: error.message || error });
  }
};

// Eliminar imagen de la galería
const eliminarImagenGaleria = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagenUrl } = req.body;

    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    espacio.galeria = espacio.galeria.filter(img => img !== imagenUrl);
    await espacio.save();
    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar imagen de la galería", error: error.message || error });
  }
};

// Eliminar un espacio deportivo y sus servicios/noticias asociadas
const eliminarEspacioDeportivo = async (req, res) => {
  try {
    const { id } = req.params;
    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) {
      return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });
    }

    // Eliminar servicios asociados
    await Servicio.deleteMany({ espacio: id });
    // Eliminar noticias asociadas
    await Noticia.deleteMany({ espacio: id });
    // Eliminar el espacio
    await EspacioDeportivo.findByIdAndDelete(id);

    res.json({ mensaje: "Espacio deportivo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el espacio deportivo", error: error.message || error });
  }
};

// Agregar cuenta bancaria
const agregarCuentaBancaria = async (req, res) => {
  try {
    const { id } = req.params;
    const { banco, titular, numeroCuenta, cedula } = req.body;
    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });

    espacio.cuentasBancarias.push({ banco, titular, numeroCuenta, cedula });
    await espacio.save();
    res.status(201).json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al agregar cuenta bancaria", error: error.message || error });
  }
};

// Editar cuenta bancaria
const editarCuentaBancaria = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;
    const { banco, titular, numeroCuenta, cedula } = req.body;
    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });

    const cuenta = espacio.cuentasBancarias.id(cuentaId);
    if (!cuenta) return res.status(404).json({ mensaje: "Cuenta bancaria no encontrada" });

    if (banco) cuenta.banco = banco;
    if (titular) cuenta.titular = titular;
    if (numeroCuenta) cuenta.numeroCuenta = numeroCuenta;
    if (cedula) cuenta.cedula = cedula;

    await espacio.save();
    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al editar cuenta bancaria", error: error.message || error });
  }
};

// Eliminar cuenta bancaria
const eliminarCuentaBancaria = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;
    const espacio = await EspacioDeportivo.findById(id);
    if (!espacio) return res.status(404).json({ mensaje: "Espacio deportivo no encontrado" });

    espacio.cuentasBancarias = espacio.cuentasBancarias.filter(c => c._id.toString() !== cuentaId);
    await espacio.save();
    res.json(espacio);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar cuenta bancaria", error: error.message || error });
  }
};

// Configuración de campos para multer
const uploadFields = upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'galeria', maxCount: 10 }
]);

module.exports = { 
  crearEspacioDeportivo: [uploadFields, crearEspacioDeportivo], 
  editarEspacioDeportivo: [uploadFields, editarEspacioDeportivo], 
  obtenerEspaciosDeportivos,
  obtenerEspacioPorId,
  obtenerEspaciosPorPropietario,
  agregarImagenGaleria: [upload.single("imagen"), agregarImagenGaleria],
  eliminarImagenGaleria,
  eliminarEspacioDeportivo,
  agregarCuentaBancaria,
  editarCuentaBancaria,
  eliminarCuentaBancaria
};
