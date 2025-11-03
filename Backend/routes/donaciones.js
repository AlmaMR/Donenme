// Backend/routes/donaciones.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const {
    createDonacion,
    getDonacionesDisponibles,
    getMisDonaciones,
    reclamarDonacion,
    updateDonacion,
    deleteDonacion,
    esperarDonacion,
    getDonacionById
} = require('../controllers/donaciones.js');

// Todas las rutas de donaciones están protegidas y requieren autenticación
router.use(authMiddleware);

// POST /api/donaciones -> Crear una nueva donación
router.post('/', createDonacion);

// GET /api/donaciones -> Obtener todas las donaciones disponibles (Marketplace)
router.get('/', getDonacionesDisponibles);

// GET /api/donaciones/mis-donaciones -> Obtener las donaciones del usuario actual
router.get('/mis-donaciones', getMisDonaciones);

// PUT /api/donaciones/:id/reclamar -> Reclamar una donación
router.put('/:id/reclamar', reclamarDonacion);
router.put('/:id/esperar', esperarDonacion); //pone la donacion en procesando...


// PUT /api/donaciones/:id -> Modificar una donación propia
router.put('/:id', updateDonacion);

// DELETE /api/donaciones/:id -> Eliminar una donación propia
router.delete('/:id', deleteDonacion);

module.exports = router;
