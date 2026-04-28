const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config(); // Cargar variables de entorno

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento en Cloudinary con Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "espacios_deportivos", // Carpeta en Cloudinary
    format: async (req, file) => "png", // Formato de la imagen
    public_id: (req, file) => Date.now() + "-" + file.originalname
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
