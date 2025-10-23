// En database.js, después de inicializar donenme_db

const initializeDatabase = async () => {
    try {
        // ... (tu código de conexión existente) ...

        // Crear índice para el login por 'contacto'
        await donenme_db.createIndex({
            index: { fields: ['contacto'] },
            name: 'contacto-index'
        });
        console.log('Índice de "contacto" asegurado en CouchDB.');

    } catch (err) {
        if (err.statusCode === 412) {
            // 412 "Precondition Failed" significa que el índice ya existe
            console.log('Índice de "contacto" ya existe.');
        } else {
            console.error('Error al inicializar la base de datos o crear el índice:', err);
        }
    }
};

// Llama a la función al iniciar
initializeDatabase();

module.exports = donenme_db;