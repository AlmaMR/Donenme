// Backend/routes/notificaciones.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require('../controllers/notificaciones');

// Todas las rutas aquí requieren autenticación
router.use(authMiddleware);

// GET /api/notificaciones - Devuelve todas las notificaciones del usuario
router.get('/', getNotifications);

// GET /api/notificaciones/no-leidas - Devuelve el conteo de no leídas
router.get('/no-leidas', getUnreadCount);

// PUT /api/notificaciones/:id/leer - Marca una notificación como leída
router.put('/:id/leer', markAsRead);

module.exports = router;
