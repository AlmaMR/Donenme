// Backend/routes/donaciones.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const {
    createDonacion,
    getDonacionesDisponibles,
    getMisDonaciones,
    updateDonacion,
    deleteDonacion,
    getDonacionById,
} = require('../controllers/donaciones.js');

const { getSolicitudesPorDonacion } = require('../controllers/solicitudes.js');

// Todas las rutas de donaciones están protegidas y requieren autenticación
router.use(authMiddleware);

// POST /api/donaciones -> Crear una nueva donación
router.post('/', createDonacion);

// GET /api/donaciones -> Obtener todas las donaciones disponibles (Marketplace)
router.get('/', getDonacionesDisponibles);

// GET /api/donaciones/mis-donaciones -> Obtener las donaciones del usuario actual
router.get('/mis-donaciones', getMisDonaciones);

// GET /api/donaciones/:id/solicitudes -> Ver las solicitudes para un donativo
router.get('/:id/solicitudes', getSolicitudesPorDonacion);

// GET /api/donaciones/:id -> Obtener una donación por ID
router.get('/:id', getDonacionById);

// PUT /api/donaciones/:id -> Modificar una donación propia
router.put('/:id', updateDonacion);

// DELETE /api/donaciones/:id -> Eliminar una donación propia
router.delete('/:id', deleteDonacion);

module.exports = router;
