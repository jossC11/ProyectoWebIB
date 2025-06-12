const express = require('express');
const AuthBusiness = require('../business/auth');
const router = express.Router();

// Obtener mensajes del chat (puedes personalizar según tu modelo)
router.get('/:citaId', AuthBusiness.middlewareAuth, async (req, res) => {
    // Aquí deberías consultar los mensajes de la cita con id = req.params.citaId
    res.json({ success: true, mensajes: [] });
});

// Enviar mensaje al chat (puedes personalizar según tu modelo)
router.post('/:citaId', AuthBusiness.middlewareAuth, async (req, res) => {
    // Aquí deberías guardar el mensaje en la base de datos
    res.json({ success: true, message: 'Mensaje enviado (simulado)' });
});

module.exports = router;