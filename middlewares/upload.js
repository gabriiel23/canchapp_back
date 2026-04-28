const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Configuración del almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'canchapp', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0]
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
