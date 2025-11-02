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
    const { nombre, contacto, contrasena, direccion, rfc, tipo_rol } = req.body; // <-- Se recibe tipo_rol
    const rol = "empresa";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            tipo_rol, // <-- Se guarda tipo_rol
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
    const { nombre, contacto, contrasena, direccion, cluni, tipo_rol } = req.body; // <-- Se recibe tipo_rol
    const rol = "ong";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            tipo_rol, // <-- Se guarda tipo_rol
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
    const { nombre, contacto, contrasena, direccion, curp, tipo_rol } = req.body; // <-- Se recibe tipo_rol
    const rol = "persona_fisica";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            tipo_rol, // <-- Se guarda tipo_rol
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
    const { nombre, contacto, contrasena, direccion, dependencia, tipo_rol } = req.body; // <-- Se recibe tipo_rol
    const rol = "gobierno";
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            tipo_rol, // <-- Se guarda tipo_rol
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
            rol: user.rol // El rol en el token sigue siendo el tipo de usuario, no la función
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
                rol: user.tipo_rol, // <-- Devolvemos el tipo_rol para el frontend
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
            id: userDoc._id,
            rol: userDoc.tipo_rol, // <-- Enviamos el rol de función (donador/receptor)
            nombre: userDoc.nombre,
            contacto: userDoc.contacto,
            direccion: userDoc.direccion
            // ... (puedes agregar otros campos seguros como rfc, cluni, etc.)
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
// FUNCIÓN PARA ACTUALIZAR PERFIL (SPRINT 3)
// ===============================================

const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { nombre, contacto, direccion, contrasena } = req.body;

    try {
        // 1. Obtener el documento actual del usuario
        const userDoc = await donenme_db.get(userId);

        // 2. Actualizar los campos proporcionados
        if (nombre) userDoc.nombre = nombre;
        if (contacto) userDoc.contacto = contacto;
        if (direccion) userDoc.direccion = direccion;

        // 3. Si se proporcionó una nueva contraseña, hashearla y actualizarla
        if (contrasena) {
            const hashedPassword = await bcrypt.hash(contrasena, 10);
            userDoc.contrasena = hashedPassword;
        }

        // 4. Guardar el documento actualizado en la base de datos
        await donenme_db.insert(userDoc);

        res.status(200).json({ 
            status: "success", 
            message: "Perfil actualizado correctamente."
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ 
            status: "error", 
            message: "Error interno del servidor al actualizar el perfil." 
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
    getUserProfile,
    updateUserProfile // <-- Exportar la nueva función
};
