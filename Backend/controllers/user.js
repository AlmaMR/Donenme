// Backend/controllers/user.js

const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Para el login

// ===============================================
// FUNCIONES SPRINT 1 (Registro)
// ===============================================

const register = async (req, res, next) => {
    const { nombre, contacto, contrasena, direccion, rfc, cluni, curp, dependencia, tipo_rol, rol } = req.body;

    if (!rol || !['empresa', 'ong', 'persona_fisica', 'gobierno'].includes(rol)) {
        return res.status(400).json({ status: "error", message: "Rol de usuario no válido." });
    }

    try {
        // VERIFICAR SI EL USUARIO YA EXISTE
        const existingUser = await donenme_db.find({
            selector: { contacto: contacto },
            limit: 1
        });

        if (existingUser.docs.length > 0) {
            return res.status(409).json({ status: "error", message: "El contacto ya está registrado." });
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const userDoc = {
            _id: uuidv4(),
            rol,
            tipo_rol,
            nombre,
            contacto,
            contrasena: hashedPassword,
            direccion,
            tipo: "usuario"
        };

        // Añadir campos específicos del rol
        if (rol === 'empresa') userDoc.rfc = rfc;
        if (rol === 'ong') userDoc.cluni = cluni;
        if (rol === 'persona_fisica') userDoc.curp = curp;
        if (rol === 'gobierno') userDoc.dependencia = dependencia;

        await donenme_db.insert(userDoc);

        // Generar token para auto-login después del registro
        const payload = {
            id: userDoc._id,
            rol: userDoc.rol
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            status: "success",
            message: `${rol.charAt(0).toUpperCase() + rol.slice(1)} registrado correctamente.`,
            token: token,
            user: {
                id: userDoc._id,
                rol: userDoc.tipo_rol,
                nombre: userDoc.nombre
            }
        });
    } catch (error) {
        next(error);
    }
};



// ===============================================
// FUNCIÓN SPRINT 2 (Login)
// ===============================================

const loginUser = async (req, res, next) => {
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
        next(error);
    }
};


const getUserProfile = async (req, res, next) => {
    console.log('--- PUNTO DE CONTROL 1: Entrando a getUserProfile ---');
    // Gracias al middleware, 'req.user' ya tiene los datos del token
    const userId = req.user.id;
    console.log(`--- PUNTO DE CONTROL 2: Buscando usuario con ID: ${userId} ---`);

    try {
        // Buscamos al usuario en la BD usando el ID del token
        const userDoc = await donenme_db.get(userId);
        console.log('--- PUNTO DE CONTROL 3: Usuario encontrado en la BD ---');

        // ¡Importante! Nunca devuelvas la contraseña
        res.status(200).json({
            id: userDoc._id,
            rol: userDoc.tipo_rol, // <-- Enviamos el rol de función (donador/receptor)
            nombre: userDoc.nombre,
            contacto: userDoc.contacto,
            direccion: userDoc.direccion
            // ... (puedes agregar otros campos seguros como rfc, cluni, etc.)
        });
        console.log('--- PUNTO DE CONTROL 4: Respuesta JSON enviada con éxito ---');
    } catch (error) {
        console.error('--- ¡ERROR CAPTURADO EN GETUSERPROFILE! ---');
        console.error(error);
        next(error);
    }
};

// ===============================================
// FUNCIÓN PARA ACTUALIZAR PERFIL (SPRINT 3)
// ===============================================
const updateUserProfile = async (req, res, next) => {
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
        next(error);
    }
};


// ===============================================
// EXPORTS (Actualizados)
// ===============================================

module.exports = {
    register,
    loginUser,
    getUserProfile,
    updateUserProfile // <-- Exportar la nueva función
};
