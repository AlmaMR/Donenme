const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    // 1. Obtener el token del header 'Authorization'
    // El formato es "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // [Bearer, <token>]

    // 2. Si no hay token, rechazar
    if (!token) {
        return res.status(401).json({ 
            status: "error", 
            message: "Acceso denegado. No se proporcionó token." 
        });
    }

    try {
        // 3. Verificar el token con nuestro secreto
        const verifiedPayload = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Si es válido, adjuntamos el payload al request
        // (El payload tiene el { id: '...', rol: '...' } que guardamos al logear)
        req.user = verifiedPayload;

        // 5. Dejar pasar a la siguiente función (el controlador)
        next();

    } catch (err) {
        // 4. Si el token es inválido (expirado, firma incorrecta), rechazar
        res.status(401).json({ 
            status: "error", 
            message: "Token inválido o expirado." 
        });
    }
};

module.exports = authMiddleware;