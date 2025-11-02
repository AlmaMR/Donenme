const express = require('express');
const router = express.Router();

// 1. Importar el middleware
const authMiddleware = require('../middleware/auth');

// 2. Importar las funciones del controlador (ahora incluye getUserProfile)
const {
    registerEmpresa,
    registerONG,
    registerPersonaFisica,
    registerGobierno,
    loginUser,
    getUserProfile // <-- Importar la nueva función
} = require('../controllers/user.js');

// Rutas de Registro (Públicas)
router.post('/register/empresa', registerEmpresa);
router.post('/register/ong', registerONG);
router.post('/register/persona_fisica', registerPersonaFisica);
router.post('/register/gobierno', registerGobierno);

// Ruta de Login (Pública)
router.post('/login', loginUser);

// 3. Nueva Ruta Protegida (Privada)
// Nota cómo 'authMiddleware' va en medio:
// 1. Petición -> 2. authMiddleware (guardia) -> 3. getUserProfile (controlador)
router.get('/me', authMiddleware, getUserProfile);


module.exports = router;