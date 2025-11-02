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
    getUserProfile, // <-- Importar la nueva función
    updateUserProfile // <-- Importar la nueva función
} = require('../controllers/user.js');

// Rutas de Registro (Públicas)
router.post('/register/empresa', registerEmpresa);
router.post('/register/ong', registerONG);
router.post('/register/persona_fisica', registerPersonaFisica);
router.post('/register/gobierno', registerGobierno);

// Ruta de Login (Pública)
router.post('/login', loginUser);

// 3. Nuevas Rutas Protegidas (Privadas)
router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateUserProfile); // <-- Nueva ruta para actualizar

module.exports = router;