// Backend/controllers/user.js

require('dotenv').config();
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Para el login

// ===============================================
// FUNCIONES SPRINT 1 (Registro)
// ===============================================

const registerEmpresa = async (req, res) => {
    const { nombre, contacto, contrasena, direccion, rfc } = req.body;
    const rol = "empresa";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            nombre,
            contacto,
            contrasena: hashedPassword,
            direccion,
            rfc,
            tipo: "usuario"
        };
        await donenme_db.insert(userDoc);
        res.status(201).json({ status: "success", message: "Empresa registrada" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const registerONG = async (req, res) => {
    const { nombre, contacto, contrasena, direccion, cluni } = req.body;
    const rol = "ong";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            nombre,
            contacto,
            contrasena: hashedPassword,
            direccion,
            cluni,
            tipo: "usuario"
        };
        await donenme_db.insert(userDoc);
        res.status(201).json({ status: "success", message: "ONG registrada" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const registerPersonaFisica = async (req, res) => {
    const { nombre, contacto, contrasena, direccion, curp } = req.body;
    const rol = "persona_fisica";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            nombre,
            contacto,
            contrasena: hashedPassword,
            direccion,
            curp,
            tipo: "usuario"
        };
        await donenme_db.insert(userDoc);
        res.status(201).json({ status: "success", message: "Persona registrada" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const registerGobierno = async (req, res) => {
    const { nombre, contacto, contrasena, direccion, dependencia } = req.body;
    const rol = "gobierno";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            nombre,
            contacto,
            contrasena: hashedPassword,
            direccion,
            dependencia,
            tipo: "usuario"
        };
        await donenme_db.insert(userDoc);
        res.status(201).json({ status: "success", message: "Gobierno registrado" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};


// ===============================================
// FUNCIÓN SPRINT 2 (Login)
// ===============================================

const loginUser = async (req, res) => {
    const { contacto, contrasena } = req.body;

    if (!contacto || !contrasena) {
        return res.status(400).json({ 
            status: "error", 
            message: "El contacto y la contraseña son requeridos" 
        });
    }

    try {
        const query = {
            selector: {
                contacto: contacto
            },
            limit: 1
        };
        
        const result = await donenme_db.find(query);

        if (result.docs.length === 0) {
            return res.status(401).json({ 
                status: "error", 
                message: "Credenciales inválidas" 
            });
        }

        const user = result.docs[0];
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);

        if (!isMatch) {
            return res.status(401).json({ 
                status: "error", 
                message: "Credenciales inválidas" 
            });
        }

        const payload = {
            id: user._id,
            rol: user.rol
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: "success",
            token: token,
            user: {
                id: user._id,
                rol: user.rol,
                nombre: user.nombre
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


const getUserProfile = async (req, res) => {
    // Gracias al middleware, 'req.user' ya tiene los datos del token
    const userId = req.user.id;

    try {
        // Buscamos al usuario en la BD usando el ID del token
        const userDoc = await donenme_db.get(userId);

        // ¡Importante! Nunca devuelvas la contraseña
        res.status(200).json({
            status: "success",
            user: {
                id: userDoc._id,
                rol: userDoc.rol,
                nombre: userDoc.nombre,
                contacto: userDoc.contacto,
                direccion: userDoc.direccion
                // ... (puedes agregar otros campos seguros como rfc, cluni, etc.)
            }
        });
    } catch (error) {
        console.error("Error al buscar perfil:", error);
        res.status(404).json({ 
            status: "error", 
            message: "Usuario no encontrado." 
        });
    }
};


// ===============================================
// EXPORTS (Actualizados)
// ===============================================

module.exports = {
    registerEmpresa,
    registerONG,
    registerPersonaFisica,
    registerGobierno,
    loginUser,
    getUserProfile // <-- Agregar la nueva función
};