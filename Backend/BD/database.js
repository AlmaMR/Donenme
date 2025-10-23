// Backend/BD/database.js

require('dotenv').config();

// 1. Conéctate a Nano
const nano = require('nano')(`http://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}`);

// 2. DEFINE la variable ANTES de usarla
// Usará 'donenme' (de tu archivo .env)
const donenme_db = nano.db.use(process.env.DB_NAME);

// 3. Define la función de inicialización
const initializeDatabase = async () => {
    try {
        // Probamos la conexión y que la DB exista
        await nano.db.get(process.env.DB_NAME);
        console.log(`Conexión a CouchDB '${process.env.DB_NAME}' exitosa.`);

        // Crear índice para el login
        await donenme_db.createIndex({
            index: { fields: ['contacto'] },
            name: 'contacto-index'
        });
        console.log('Índice de "contacto" asegurado en CouchDB.');

    } catch (err) {
        if (err.statusCode === 404) {
             console.error(`Error: La base de datos '${process.env.DB_NAME}' no existe. Revisa tu .env`);
        } else if (err.statusCode === 412) {
            // El índice ya existe, no es un error
            console.log('Índice de "contacto" ya existe.');
        } else {
            // Otro error de conexión
            console.error('Error al inicializar la base de datos o crear el índice:', err.message);
        }
    }
};

// 4. Llama a la función
initializeDatabase();

// 5. Exporta la variable (que ya definimos en el paso 2)
module.exports = donenme_db;