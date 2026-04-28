const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento genérico en Cloudinary con Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "canchapp", // Carpeta principal para el proyecto
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => Date.now() + "-" + file.originalname.split('.')[0]
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };

