const express = require('express');
const router = express.Router();

// 1. Importar el middleware
const authMiddleware = require('../middleware/auth');

// 2. Importar las funciones del controlador
const {
    register, // <-- Usar la función de registro unificada
    loginUser,
    getUserProfile,
    updateUserProfile
} = require('../controllers/user.js');

// Ruta de Registro Unificada (Pública)
router.post('/register', register);

// Ruta de Login (Pública)
router.post('/login', loginUser);

// 3. Nuevas Rutas Protegidas (Privadas)
router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateUserProfile);

module.exports = router;