require('dotenv').config();
const express = require('express');
const cors = require('cors');
const donenme_db = require('./BD/database'); // Se conecta y asegura el índice

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones de tu frontend
app.use(express.json()); // Parsea body de JSON
app.use(express.urlencoded({ extended: true }));

// Rutas
// Conecta tus rutas de usuario
app.use('/api/users', require('./routes/user')); 
app.use('/api/donaciones', require('./routes/donaciones')); // <-- Nueva ruta para donaciones
app.use('/api/solicitudes', require('./routes/solicitudes')); // <-- Nueva ruta para solicitudes

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});