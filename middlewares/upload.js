const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Guardar en la carpeta "uploads"
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único
  },
});

// Filtrar archivos permitidos
const fileFilter = (req, file, cb) => {
  // A veces los dispositivos móviles envían application/octet-stream o no incluyen el mimetype correctamente.
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido (${file.mimetype}). Solo se permiten imágenes.`), false);
  }
};

// Middleware de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo 5MB
});

module.exports = upload;
