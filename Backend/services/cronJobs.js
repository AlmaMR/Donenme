// Backend/services/cronJobs.js
const cron = require('node-cron');
const donenme_db = require('../BD/database');
const { createNotification } = require('../controllers/notificaciones');

const initCronJobs = () => {
  console.log('Inicializando cron jobs...');

  // Tarea 1: Alerta de Caducidad (cada hora)
  cron.schedule('0 * * * *', async () => {
    console.log('Running cron job: Alerta de Caducidad');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      const selector = {
        tipo: 'donacion',
        borrado: { '$ne': true },
        'productos.restantes': { '$gt': 0 },
        'productos.fecha_caducidad': { '$lt': tomorrow.toISOString() }
      };
      const result = await donenme_db.find({ selector });

      for (const donacion of result.docs) {
        for (const producto of donacion.productos) {
          if (producto.restantes > 0 && new Date(producto.fecha_caducidad) < tomorrow) {
            await createNotification(
              donacion.donadorId,
              'Producto Próximo a Caducar',
              `El producto "${producto.tipo}" está a punto de caducar.`,
              donacion._id,
              'CADUCIDAD'
            );
          }
        }
      }
    } catch (error) {
      console.error('Error en el cron job de caducidad:', error);
    }
  });

  // Tarea 2: Recordatorio de Encuentro (cada 30 minutos)
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running cron job: Recordatorio de Encuentro');
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
      const selector = {
        tipo: 'solicitud',
        estado: 'aceptada',
      };
      const result = await donenme_db.find({ selector });

      for (const solicitud of result.docs) {
        const encounterDateTime = new Date(`${solicitud.fecha_encuentro}T${solicitud.hora_encuentro}`);
        if (encounterDateTime > now && encounterDateTime < twoHoursLater) {
          // Notificación para el receptor
          await createNotification(
            solicitud.receptorId,
            'Recordatorio de Encuentro',
            `Recuerda tu encuentro programado para hoy a las ${solicitud.hora_encuentro}.`,
            solicitud._id,
            'ENCUENTRO'
          );
          // Notificación para el donador
          await createNotification(
            solicitud.donadorId,
            'Recordatorio de Encuentro',
            `Recuerda tu encuentro con ${solicitud.receptorNombre} programado para hoy a las ${solicitud.hora_encuentro}.`,
            solicitud._id,
            'ENCUENTRO'
          );
        }
      }
    } catch (error) {
      console.error('Error en el cron job de encuentro:', error);
    }
  });
};

module.exports = { initCronJobs };
