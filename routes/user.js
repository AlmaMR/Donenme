// routes/user.js

const express = require('express');
const router = express.Router();

// 1. Importar la nueva función de login
const {
    registerEmpresa,
    registerONG,
    registerPersonaFisica,
    registerGobierno,
    loginUser // <-- Importar aquí
} = require('../controllers/user.js');

// Rutas de Registro (Existentes)
router.post('/register/empresa', registerEmpresa);
router.post('/register/ong', registerONG);
router.post('/register/persona_fisica', registerPersonaFisica);
router.post('/register/gobierno', registerGobierno);

// 2. Nueva Ruta de Login
router.post('/login', loginUser);


module.exports = router;