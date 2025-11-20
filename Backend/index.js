require('dotenv').config();

// =================================================================
// CAPTURADORES DE ERRORES DE PROCESO (AÑADIR ESTO AL INICIO)
// =================================================================
process.on('exit', (code) => {
  console.log(`--- EL PROCESO ESTÁ A PUNTO DE SALIR CON CÓDIGO: ${code} ---`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('--- RECHAZO DE PROMESA NO MANEJADO ---');
  console.error('Razón:', reason);
  console.error('------------------------------------');
});

process.on('uncaughtException', (error) => {
  console.error('--- EXCEPCIÓN NO CAPTURADA ---');
  console.error('Error:', error);
  console.error('------------------------------');
  process.exit(1); // Es buena práctica reiniciar en este caso
});
// =================================================================

const express = require('express');
const cors = require('cors');
const donenme_db = require('./BD/database'); // Se conecta y asegura el índice
const { initCronJobs } = require('./services/cronJobs'); // Importar cron jobs

const app = express();
const port = process.env.PORT || 3000;

// Middleware para habilitar CORS
app.use(cors());

// Middlewares
app.use(express.json()); // Parsea body de JSON
app.use(express.urlencoded({ extended: true }));

// Rutas
// Conecta tus rutas de usuario
app.use('/users', require('./routes/user')); 
app.use('/donaciones', require('./routes/donaciones')); // <-- Nueva ruta para donaciones
app.use('/solicitudes', require('./routes/solicitudes')); // <-- Nueva ruta para solicitudes
app.use('/notificaciones', require('./routes/notificaciones')); // <-- Nueva ruta para notificaciones

// Iniciar Cron Jobs
// initCronJobs();

// =================================================================
// MANEJADOR DE ERRORES GLOBAL (ÚNICO Y DEFINITIVO)
// =================================================================
app.use((err, req, res, next) => {
  console.error('--- ¡ERROR GLOBAL CAPTURADO! ---');
  console.error(err.stack);
  console.error('---------------------------------');
  res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Algo salió mal.' });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});