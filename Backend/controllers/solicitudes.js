// Backend/controllers/solicitudes.js

require('dotenv').config();
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificaciones');

// ===============================================
// GET SOLICITUDES BY THE CURRENT USER
// ===============================================
const getMisSolicitudes = async (req, res) => {
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
        console.error("Error al obtener mis solicitudes:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// CREAR UNA NUEVA SOLICITUD (ENVIAR SOLICITUD)
// ===============================================
const createSolicitud = async (req, res) => {
    const receptorId = req.user.id;
    const { donacionId, productos, fecha_encuentro, hora_encuentro, contacto } = req.body;

    if (!donacionId || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: "Datos incompletos. Se requieren donacionId y productos." });
    }

    try {
        const donacion = await donenme_db.get(donacionId);
        const receptor = await donenme_db.get(receptorId); // Get receptor's data for their name

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
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación o usuario no encontrado." });
        }
        console.error("Error al crear solicitud:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// VER SOLICITUDES PARA UN DONATIVO
// ===============================================
const getSolicitudesPorDonacion = async (req, res) => {
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

        const solicitudesEnriquecidas = await Promise.all(result.docs.map(async (solicitud) => {
            try {
                const receptor = await donenme_db.get(solicitud.receptorId);
                return { ...solicitud, receptorNombre: receptor.nombre };
            } catch (e) {
                return { ...solicitud, receptorNombre: 'Usuario Desconocido' };
            }
        }));

        res.status(200).json(solicitudesEnriquecidas);

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al obtener solicitudes:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// APROBAR UNA SOLICITUD
// ===============================================
const aprobarSolicitud = async (req, res) => {
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
                await donenme_db.insert(solicitud);
                return res.status(400).json({ message: `Stock insuficiente para el producto ${itemSolicitado.tipo}.` });
            }
        }

        // Actualizar el stock de la donación de forma inmutable
        const productosActualizados = donacion.productos.map(productoEnDonacion => {
            const productoEnSolicitud = solicitud.productos.find(p => p.id === productoEnDonacion.id);
            if (productoEnSolicitud) {
                // Este es el producto que se está reclamando, actualizar su stock
                return {
                    ...productoEnDonacion,
                    restantes: productoEnDonacion.restantes - productoEnSolicitud.cantidad
                };
            }
            // Este producto no fue solicitado, devolverlo como está
            return productoEnDonacion;
        });

        // Crear el objeto de donación actualizado con la nueva lista de productos
        const donacionActualizada = {
            ...donacion,
            productos: productosActualizados
        };

        // Guardar la donación actualizada en la base de datos
        await donenme_db.insert(donacionActualizada);

        solicitud.estado = 'aceptada';
        await donenme_db.insert(solicitud);

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
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Solicitud o donación no encontrada." });
        }
        console.error("Error al aprobar solicitud:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// RECHAZAR UNA SOLICITUD
// ===============================================
const rechazarSolicitud = async (req, res) => {
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
        await donenme_db.insert(solicitud);

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
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Solicitud o donación no encontrada." });
        }
        console.error("Error al rechazar solicitud:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


module.exports = {
    createSolicitud,
    getSolicitudesPorDonacion,
    aprobarSolicitud,
    rechazarSolicitud,
    getMisSolicitudes,
};