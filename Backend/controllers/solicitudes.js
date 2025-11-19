// Backend/controllers/solicitudes.js

const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificaciones');

// ===============================================
// GET SOLICITUDES BY THE CURRENT USER
// ===============================================
const getMisSolicitudes = async (req, res, next) => {
    const receptorId = req.user.id;

    try {
        const query = {
            selector: {
                tipo: "solicitud",
                receptorId: receptorId
            }
        };
        const result = await donenme_db.find(query);
        res.status(200).json(result.docs);
    } catch (error) {
        next(error);
    }
};

// ===============================================
// CREAR UNA NUEVA SOLICITUD (ENVIAR SOLICITUD)
// ===============================================
const createSolicitud = async (req, res, next) => {
    const receptorId = req.user.id;
    const { donacionId, productos, fecha_encuentro, hora_encuentro, contacto } = req.body;

    if (!donacionId || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: "Datos incompletos. Se requieren donacionId y productos." });
    }

    try {
        // Optimización: Obtener donación y receptor en una sola llamada
        const fetchResult = await donenme_db.fetch({ keys: [donacionId, receptorId] });
        const donacionRow = fetchResult.rows.find(row => row.id === donacionId);
        const receptorRow = fetchResult.rows.find(row => row.id === receptorId);

        if (!donacionRow || !donacionRow.doc) {
            return res.status(404).json({ message: "La donación especificada no existe." });
        }
        if (!receptorRow || !receptorRow.doc) {
            return res.status(404).json({ message: "El usuario receptor no fue encontrado." });
        }

        const donacion = donacionRow.doc;
        const receptor = receptorRow.doc;

        if (donacion.donadorId === receptorId) {
            return res.status(403).json({ message: "No puedes solicitar tu propia donación." });
        }

        const nuevaSolicitud = {
            _id: uuidv4(),
            tipo: "solicitud",
            receptorId,
            donacionId,
            productos,
            estado: 'enviada',
            fecha_encuentro,
            hora_encuentro,
            contacto,
        };

        await donenme_db.insert(nuevaSolicitud);

        // ** TRIGGER: Notificación para el donador **
        await createNotification(
            donacion.donadorId,
            'Nueva Solicitud Recibida',
            `Has recibido una nueva solicitud de ${receptor.nombre}.`,
            nuevaSolicitud._id,
            'SOLICITUD'
        );

        res.status(201).json({ message: "Solicitud enviada con éxito", solicitud: nuevaSolicitud });

    } catch (error) {
        next(error);
    }
};

// ===============================================
// VER SOLICITUDES PARA UN DONATIVO
// ===============================================
const getSolicitudesPorDonacion = async (req, res, next) => {
    const donacionId = req.params.id;
    const userId = req.user.id;

    try {
        const donacion = await donenme_db.get(donacionId);

        if (donacion.donadorId !== userId) {
            return res.status(403).json({ message: "Acción no permitida. No eres el propietario de esta donación." });
        }

        const query = {
            selector: {
                tipo: "solicitud",
                donacionId: donacionId,
                estado: 'enviada'
            }
        };
        const result = await donenme_db.find(query);
        const solicitudes = result.docs;

        if (solicitudes.length === 0) {
            return res.status(200).json([]);
        }

        // Optimización N+1: Obtener todos los receptores en una sola consulta
        const receptorIds = [...new Set(solicitudes.map(s => s.receptorId))];
        const receptoresResult = await donenme_db.fetch({ keys: receptorIds });

        const receptoresMap = receptoresResult.rows.reduce((map, row) => {
            if (row.doc) {
                map[row.doc._id] = row.doc.nombre;
            }
            return map;
        }, {});

        const solicitudesEnriquecidas = solicitudes.map(solicitud => ({
            ...solicitud,
            receptorNombre: receptoresMap[solicitud.receptorId] || 'Usuario Desconocido'
        }));

        res.status(200).json(solicitudesEnriquecidas);

    } catch (error) {
        next(error);
    }
};

// ===============================================
// APROBAR UNA SOLICITUD
// ===============================================
const aprobarSolicitud = async (req, res, next) => {
    const solicitudId = req.params.id;
    const userId = req.user.id;

    try {
        const solicitud = await donenme_db.get(solicitudId);
        const donacion = await donenme_db.get(solicitud.donacionId);

        if (donacion.donadorId !== userId) {
            return res.status(403).json({ message: "Acción no permitida. No eres el propietario de esta donación." });
        }

        for (const itemSolicitado of solicitud.productos) {
            const itemDonado = donacion.productos.find(p => p.id === itemSolicitado.id);
            if (!itemDonado || itemDonado.restantes < itemSolicitado.cantidad) {
                solicitud.estado = 'rechazada';
                solicitud.comentario = `Stock insuficiente para el producto ${itemSolicitado.tipo}.`;
                await donenme_db.insert(solicitud); // Guardar el rechazo por falta de stock
                return res.status(400).json({ message: `Stock insuficiente para el producto ${itemSolicitado.tipo}.` });
            }
        }

        // Actualizar el stock de la donación
        donacion.productos = donacion.productos.map(productoEnDonacion => {
            const productoEnSolicitud = solicitud.productos.find(p => p.id === productoEnDonacion.id);
            if (productoEnSolicitud) {
                return {
                    ...productoEnDonacion,
                    restantes: productoEnDonacion.restantes - productoEnSolicitud.cantidad
                };
            }
            return productoEnDonacion;
        });

        // Actualizar el estado de la solicitud
        solicitud.estado = 'aceptada';

        // Usar bulk para una operación atómica
        await donenme_db.bulk({ docs: [donacion, solicitud] });

        // ** TRIGGER: Notificación para el receptor **
        await createNotification(
            solicitud.receptorId,
            'Solicitud Aprobada',
            'Tu solicitud ha sido aprobada. Revisa los detalles del encuentro.',
            solicitud._id,
            'SOLICITUD'
        );

        res.status(200).json({ message: "Solicitud aprobada con éxito." });

    } catch (error) {
        next(error);
    }
};

// ===============================================
// RECHAZAR UNA SOLICITUD
// ===============================================
const rechazarSolicitud = async (req, res, next) => {
    const solicitudId = req.params.id;
    const userId = req.user.id;
    const { comentario } = req.body;

    if (!comentario) {
        return res.status(400).json({ message: "El comentario es requerido para rechazar una solicitud." });
    }

    try {
        const solicitud = await donenme_db.get(solicitudId);
        const donacion = await donenme_db.get(solicitud.donacionId);

        if (donacion.donadorId !== userId) {
            return res.status(403).json({ message: "Acción no permitida. No eres el propietario de esta donación." });
        }

        solicitud.estado = 'rechazada';
        solicitud.comentario = comentario;
        
        // Usar bulk por consistencia, aunque sea un solo documento
        await donenme_db.bulk({ docs: [solicitud] });

        // ** TRIGGER: Notificación para el receptor **
        await createNotification(
            solicitud.receptorId,
            'Solicitud Rechazada',
            `Tu solicitud ha sido rechazada. Motivo: ${comentario}`,
            solicitud._id,
            'SOLICITUD'
        );

        res.status(200).json({ message: "Solicitud rechazada con éxito." });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createSolicitud,
    getSolicitudesPorDonacion,
    aprobarSolicitud,
    rechazarSolicitud,
    getMisSolicitudes,
};