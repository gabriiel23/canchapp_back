const mongoose = require('mongoose');
require('dotenv').config(); // Cargar variables de entorno desde .env

const dbURI = process.env.MONGODB_URI; // Solo usa la variable de entorno

if (!dbURI) {
  console.error('Error: La variable de entorno MONGODB_URI no está definida.');
  process.exit(1); // Terminar el proceso si no está definida
}

mongoose.connect(dbURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a la base de datos:'));
db.once('open', () => {
  console.log('¡Conexión a la base de datos establecida correctamente!');
});
