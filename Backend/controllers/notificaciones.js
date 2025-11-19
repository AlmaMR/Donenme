// Backend/controllers/notificaciones.js
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Crea y guarda una nueva notificación en la base de datos.
 * @param {string} usuarioId - ID del usuario que recibirá la notificación.
 * @param {string} titulo - Título de la notificación.
 * @param {string} mensaje - Contenido del mensaje.
 * @param {string} referenciaId - ID del documento relacionado (donación, solicitud).
 * @param {'CADUCIDAD' | 'SOLICITUD' | 'ENCUENTRO' | 'SISTEMA'} tipo_evento - Tipo de evento que genera la notificación.
 */
const createNotification = async (usuarioId, titulo, mensaje, referenciaId, tipo_evento) => {
  try {
    const notificacion = {
      _id: uuidv4(),
      tipo: 'notificacion',
      usuarioId,
      titulo,
      mensaje,
      leida: false,
      fecha_creacion: new Date().toISOString(),
      referenciaId,
      tipo_evento,
    };
    await donenme_db.insert(notificacion);
    console.log(`Notificación creada para el usuario ${usuarioId} por evento ${tipo_evento}`);
  } catch (error) {
    console.error('Error interno al crear la notificación:', error);
    // No se puede usar next(error) aquí porque no es un middleware de ruta.
  }
};

// Obtener todas las notificaciones para el usuario autenticado
const getNotifications = async (req, res, next) => {
  try {
    const selector = {
      tipo: 'notificacion',
      usuarioId: req.user.id,
    };
    const result = await donenme_db.find({ selector, sort: [{ fecha_creacion: 'desc' }] });
    res.status(200).json(result.docs);
  } catch (error) {
    next(error);
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res, next) => {
  try {
    const notificacionId = req.params.id;
    const doc = await donenme_db.get(notificacionId);

    // Verificar que la notificación pertenece al usuario
    if (doc.usuarioId !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta notificación.' });
    }

    doc.leida = true;
    await donenme_db.insert(doc);
    res.status(200).json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    next(error);
  }
};

// Obtener el conteo de notificaciones no leídas
const getUnreadCount = async (req, res, next) => {
  try {
    const selector = {
      tipo: 'notificacion',
      usuarioId: req.user.id,
      leida: false,
    };
    const result = await donenme_db.find({ selector });
    res.status(200).json({ count: result.docs.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  getUnreadCount,
};
