// Backend/routes/solicitudes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const {
    createSolicitud,
    getSolicitudesPorDonacion,
    aprobarSolicitud,
    rechazarSolicitud,
    getMisSolicitudes,
} = require('../controllers/solicitudes.js');

// Todas las rutas de solicitudes están protegidas y requieren autenticación
router.use(authMiddleware);

// GET /api/solicitudes/mis-solicitudes -> Obtener las solicitudes del usuario actual
router.get('/mis-solicitudes', getMisSolicitudes);

// POST /api/solicitudes -> Enviar una solicitud para una donación
router.post('/', createSolicitud);

// GET /api/donaciones/:id/solicitudes -> Ver las solicitudes para un donativo
router.get('/donacion/:id', getSolicitudesPorDonacion);

// PUT /api/solicitudes/:id/aprobar -> Aprobar una solicitud
router.put('/:id/aprobar', aprobarSolicitud);

// PUT /api/solicitudes/:id/rechazar -> Rechazar una solicitud
router.put('/:id/rechazar', rechazarSolicitud);

module.exports = router;
