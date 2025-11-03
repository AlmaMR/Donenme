// Backend/controllers/donaciones.js

require('dotenv').config();
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');

// ===============================================
// CREAR UNA NUEVA DONACIÓN
// ===============================================
const createDonacion = async (req, res) => {
    const donadorId = req.user.id; // ID del usuario autenticado
    const { productos, punto_reunion } = req.body;

    if (!productos || !punto_reunion || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: "Datos incompletos. Se requieren productos y punto de reunión." });
    }

    try {
        const nuevaDonacion = {
            _id: uuidv4(),
            tipo: "donativo",
            donadorId,
            receptorId: null, // Aún no ha sido reclamado
            productos: productos.map(p => ({ ...p, id: uuidv4() })), // Asignar un ID único a cada producto
            punto_reunion,
            estado: 'disponible', // Estado inicial
            fecha_creacion: new Date().toISOString(),
            fecha_reclamacion: null
        };

        await donenme_db.insert(nuevaDonacion);
        res.status(201).json({ message: "Donación creada con éxito", donacion: nuevaDonacion });

    } catch (error) {
        console.error("Error al crear donación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// OBTENER DONACIONES DISPONIBLES (MARKETPLACE)
// ===============================================
const getDonacionesDisponibles = async (req, res) => {
    try {
        const query = {
            selector: {
                tipo: "donativo",
                estado: 'disponible' && "Procesando..."
            }
        };
        const result = await donenme_db.find(query);
        
        // Opcional: Enriquecer con datos del donador
        const donacionesPromesas = result.docs.map(async (donacion) => {
            try {
                const donador = await donenme_db.get(donacion.donadorId);
                // No enviar datos sensibles
                return { ...donacion, donador: { nombre: donador.nombre, rol: donador.rol } };
            } catch (e) {
                // Si el donador no se encuentra, devolver la donación sin enriquecer
                return donacion;
            }
        });

        const donacionesEnriquecidas = await Promise.all(donacionesPromesas);

        res.status(200).json(donacionesEnriquecidas);

    } catch (error) {
        console.error("Error al obtener donaciones:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


// ===============================================
// OBTENER LAS DONACIONES DE UN USUARIO (MIS DONACIONES)
// ===============================================
const getMisDonaciones = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = {
            selector: {
                tipo: "donativo",
                donadorId: userId
            },
            sort: [{ "fecha_creacion": "desc" }]
        };
        const result = await donenme_db.find(query);
        res.status(200).json(result.docs);

    } catch (error) {
        console.error("Error al obtener mis donaciones:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


// ===============================================
// RECLAMAR UNA DONACIÓN
// ===============================================

const reclamarDonacion = async (req, res) => {
    const donacionId = req.params.id;
    const receptorId = req.user.id; // ID del usuario que reclama

    try {
        const donacion = await donenme_db.get(donacionId);

        // Verificar que el que reclama no sea el mismo que donó


        // Verificar que la donación esté disponible
        if (donacion.estado !== 'Procesando...') {
            return res.status(400).json({ message: `Esta donación ya fue reclamada y su estado es '${donacion.estado}'.` });
        }

        // Actualizar el estado y guardar el ID del receptor
        donacion.estado = 'reclamada';
        donacion.fecha_reclamacion = new Date().toISOString();

        await donenme_db.insert(donacion);

        res.status(200).json({ message: "Donación reclamada con éxito", donacion });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al reclamar donación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
const esperarDonacion = async (req, res) => {
    const donacionId = req.params.id;
    const receptorId = req.user.id; // ID del usuario que reclama

    try {
        const donacion = await donenme_db.get(donacionId);

        // Verificar que el que reclama no sea el mismo que donó
        if (donacion.donadorId === receptorId) {
            return res.status(403).json({ message: "No puedes reclamar tu propia donación." });
        }

        // Verificar que la donación esté disponible
        if (donacion.estado !== 'disponible') {
            return res.status(400).json({ message: `Esta donación ya fue reclamada y su estado es '${donacion.estado}'.` });
        }

        // Actualizar el estado y guardar el ID del receptor
        donacion.estado = 'Procesando...';
        donacion.receptorId = receptorId;
        donacion.fecha_reclamacion = new Date().toISOString();

        await donenme_db.insert(donacion);

        res.status(200).json({ message: "Donación reclamada con éxito", donacion });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al reclamar donación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// MODIFICAR UNA DONACIÓN
// ===============================================
const updateDonacion = async (req, res) => {
    const donacionId = req.params.id;
    const userId = req.user.id;
    const { productos, punto_reunion } = req.body;

    try {
        const donacion = await donenme_db.get(donacionId);

        // Lógica de Autorización: Verificar que el usuario sea el donador
        if (donacion.donadorId !== userId) {
            return res.status(403).json({ message: "Acción no permitida. No eres el propietario de esta donación." });
        }

        // Regla de Negocio: Verificar que la donación esté disponible
        if (donacion.estado !== 'disponible') {
            return res.status(400).json({ message: "No se puede modificar una donación que ya no está disponible." });
        }

        // Actualizar los campos permitidos
        if (productos) donacion.productos = productos;
        if (punto_reunion) donacion.punto_reunion = punto_reunion;

        await donenme_db.insert(donacion);

        res.status(200).json({ message: "Donación actualizada con éxito", donacion });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al modificar donación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// ELIMINAR UNA DONACIÓN
// ===============================================
const deleteDonacion = async (req, res) => {
    const donacionId = req.params.id;
    const userId = req.user.id;

    try {
        const donacion = await donenme_db.get(donacionId);

        // Lógica de Autorización: Verificar que el usuario sea el donador
        if (donacion.donadorId !== userId) {
            return res.status(403).json({ message: "Acción no permitida. No eres el propietario de esta donación." });
        }

        // Regla de Negocio: Verificar que la donación esté disponible
        if (donacion.estado !== 'disponible') {
            return res.status(400).json({ message: "No se puede eliminar una donación que ya no está disponible." });
        }

        // Eliminar el documento
        await donenme_db.destroy(donacion._id, donacion._rev);

        res.status(200).json({ message: "Donación eliminada con éxito." });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al eliminar donación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


module.exports = {
    createDonacion,
    getDonacionesDisponibles,
    getMisDonaciones, // <-- Exportar la nueva función
    reclamarDonacion,
    updateDonacion,
    deleteDonacion,
    esperarDonacion
};
