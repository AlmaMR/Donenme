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
    console.error('Error al crear la notificación:', error);
  }
};

// Obtener todas las notificaciones para el usuario autenticado
const getNotifications = async (req, res) => {
  try {
    const selector = {
      tipo: 'notificacion',
      usuarioId: req.user.id,
    };
    const result = await donenme_db.find({ selector, sort: [{ fecha_creacion: 'desc' }] });
    res.status(200).json(result.docs);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res) => {
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
    console.error('Error al marcar la notificación como leída:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Obtener el conteo de notificaciones no leídas
const getUnreadCount = async (req, res) => {
  try {
    const selector = {
      tipo: 'notificacion',
      usuarioId: req.user.id,
      leida: false,
    };
    const result = await donenme_db.find({ selector });
    res.status(200).json({ count: result.docs.length });
  } catch (error) {
    console.error('Error al obtener el conteo de no leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  getUnreadCount,
};
