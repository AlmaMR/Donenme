// Backend/controllers/donaciones.js

require('dotenv').config();
const donenme_db = require('../BD/database');
const { v4: uuidv4 } = require('uuid');

// ===============================================
// GET A DONATION BY ID
// ===============================================
const getDonacionById = async (req, res) => {
    const donacionId = req.params.id;

    try {
        const donacion = await donenme_db.get(donacionId);
        res.status(200).json(donacion);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "Donación no encontrada." });
        }
        console.error("Error al obtener donación por ID:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ===============================================
// CREAR UNA NUEVA DONACIÓN
// ===============================================
const createDonacion = async (req, res) => {
    const donadorId = req.user.id; // ID del usuario autenticado
    const { productos, punto_reunion, fecha_encuentro, hora_encuentro } = req.body;

    if (!productos || !punto_reunion || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: "Datos incompletos. Se requieren productos y punto de reunión." });
    }

    const productosValidados = [];

    // Validar cada producto en el array
    for (const p of productos) {

        // --- INICIO DE LA VALIDACIÓN DE FECHA MODIFICADA ---
        const todayTimestamp = new Date().setHours(0, 0, 0, 0);
        const fechaCaducidad = new Date(p.fecha_caducidad + 'T00:00:00');
        const caducidadTimestamp = fechaCaducidad.getTime();

        if (caducidadTimestamp < todayTimestamp) {
            return res.status(400).json({ message: `La fecha de caducidad del producto "${p.tipo}" (${p.fecha_caducidad}) no puede ser anterior a hoy.` });
        }
        // --- FIN DE LA VALIDACIÓN DE FECHA MODIFICADA ---

        productosValidados.push({
            id: uuidv4(), // Asignar un ID único al producto
            tipo: p.tipo,
            cantidad: parseInt(p.cantidad),
            restantes: parseInt(p.cantidad), // Set restantes to cantidad
            fecha_caducidad: p.fecha_caducidad,
            descripcion: p.descripcion,
            entregado: false,
        });
    }

    try {
        const nuevaDonacion = {
            _id: uuidv4(),
            tipo: "donativo",
            donadorId,
            productos: productosValidados,
            punto_reunion,
            fecha_encuentro,
            hora_encuentro,
            fecha_ingreso: new Date().toISOString(),
            borrado: false,
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
                borrado: false,
                "productos": {
                    "$elemMatch": {
                        "restantes": { "$gt": 0 }
                    }
                }
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
                donadorId: userId,
                borrado: false
            }
        };
        const result = await donenme_db.find(query);
        res.status(200).json(result.docs);

    } catch (error) {
        console.error("Error al obtener mis donaciones:", error);
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

        // TODO: Implementar la lógica de no permitir la modificación si hay solicitudes aceptadas.
        // Por ahora, se mantiene la lógica anterior.
        const solicitudesQuery = {
            selector: {
                donacionId: donacionId,
                estado: 'aceptada'
            }
        };
        const solicitudes = await donenme_db.find(solicitudesQuery);
        if (solicitudes.docs.length > 0) {
            return res.status(400).json({ message: "No se puede modificar una donación que ya tiene solicitudes aceptadas." });
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
// ELIMINAR UNA DONACIÓN (SOFT DELETE)
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

        // Soft delete
        donacion.borrado = true;
        await donenme_db.insert(donacion);

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
    getMisDonaciones,
    updateDonacion,
    deleteDonacion,
    getDonacionById,
};