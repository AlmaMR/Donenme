// controllers/user.js

require('dotenv').config(); // Ya presente en tu archivo
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid'); // Ya presente
const bcrypt = require('bcrypt'); // Ya presente
const jwt = require('jsonwebtoken'); // <-- 1. Importar JWT

// ... (Aquí van tus funciones existentes: registerEmpresa, registerONG, etc.) ...

// 2. Nueva función de Login
const loginUser = async (req, res) => {
    const { contacto, contrasena } = req.body;

    // Validación básica de entrada
    if (!contacto || !contrasena) {
        return res.status(400).json({ 
            status: "error", 
            message: "El contacto y la contraseña son requeridos" 
        });
    }

    try {
        // Usamos una Mango Query para buscar al usuario por el campo 'contacto'
        const query = {
            selector: {
                contacto: contacto
            },
            limit: 1 // Solo esperamos un resultado
        };
        
        const result = await donenme_db.find(query);

        // Caso 1: Usuario no encontrado
        if (result.docs.length === 0) {
            return res.status(401).json({ 
                status: "error", 
                message: "Credenciales inválidas" 
            });
        }

        const user = result.docs[0];

        // Caso 2: Usuario encontrado, comparar contraseñas
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);

        // Caso 3: Contraseña incorrecta
        if (!isMatch) {
            return res.status(401).json({ 
                status: "error", 
                message: "Credenciales inválidas" 
            });
        }

        // Caso 4: Éxito (Usuario y contraseña correctos)
        // Crear el payload del JWT
        const payload = {
            id: user._id,
            rol: user.rol // El 'rol' se debió guardar durante el registro
        };

        // Firmar el token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // El token expira en 24 horas
        );

        // Enviar respuesta exitosa con el token y datos básicos del usuario
        res.status(200).json({
            status: "success",
            token: token,
            user: {
                id: user._id,
                rol: user.rol,
                nombre: user.nombre // Incluimos el nombre para la UI
            }
        });

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ 
            status: "error", 
            message: "Error interno del servidor" 
        });
    }
};


// 3. Actualizar module.exports
module.exports = {
    registerEmpresa,
    registerONG,
    registerPersonaFisica,
    registerGobierno,
    loginUser // <-- Agregar la nueva función
};