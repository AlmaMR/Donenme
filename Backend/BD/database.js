// Backend/BD/database.js

require('dotenv').config();

// 1. Conéctate a Nano
const nano = require('nano')(`http://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}`);

// 2. DEFINE la variable ANTES de usarla
// Usará 'donenme' (de tu archivo .env)
const donenme_db = nano.db.use(process.env.DB_NAME);

// 3. Define la función de inicialización
const initializeDatabase = async () => {
    // Función helper para crear índices de forma segura
    const ensureIndex = async (indexDef, indexName) => {
        try {
            await donenme_db.createIndex(indexDef);
            console.log(`Índice "${indexName}" asegurado en CouchDB.`);
        } catch (err) {
            if (err.statusCode === 412) {
                // El índice ya existe, no es un error
                console.log(`Índice "${indexName}" ya existe.`);
            } else {
                // Re-lanzar otros errores para que sean capturados por el catch principal
                throw err;
            }
        }
    };

    try {
        // Probamos la conexión y que la DB exista
        await nano.db.get(process.env.DB_NAME);
        console.log(`Conexión a CouchDB '${process.env.DB_NAME}' exitosa.`);

        // Asegurar los índices necesarios
        await ensureIndex({ index: { fields: ['contacto'] }, name: 'contacto-index' }, 'contacto');
        await ensureIndex({ index: { fields: ['tipo', 'donadorId', 'borrado', 'fecha_ingreso'] }, name: 'donaciones-por-donador-fecha-index' }, 'donaciones por donador por fecha');
        await ensureIndex({ index: { fields: ['tipo', 'usuarioId', 'fecha_creacion'] }, name: 'notificaciones-por-usuario-fecha-index' }, 'notificaciones por usuario por fecha');

    } catch (err) {
        if (err.statusCode === 404) {
            console.error(`Error: La base de datos '${process.env.DB_NAME}' no existe. Revisa tu .env`);
        } else {
            // Otro error de conexión o al crear índices
            console.error('Error al inicializar la base de datos:', err.message);
        }
    }
};

// 4. Llama a la función
initializeDatabase();

// 5. Exporta la variable (que ya definimos en el paso 2)
module.exports = donenme_db;