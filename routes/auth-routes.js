const express = require('express');
const AuthBusiness = require('../business/auth');
const UsuariosData = require('../data/usuarios');
const MascotasData = require('../data/mascotas');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validar datos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        // Autenticar usuario
        const resultado = await AuthBusiness.autenticar(email, password);
        if (!resultado.success) {
            return res.status(401).json(resultado);
        }
        // Guardar usuario en sesión
        req.session.usuario = resultado.usuario;
        res.json({
            success: true,
            usuario: resultado.usuario,
            message: 'Login exitoso'
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Registro
router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, telefono, rol } = req.body;
        // Solo permitir registro de clientes por defecto
        const rolUsuario = rol === 'cliente' ? 'cliente' : 'cliente';
        const datosUsuario = {
            nombre,
            email,
            password,
            telefono,
            rol: rolUsuario
        };
        const resultado = await AuthBusiness.registrar(datosUsuario);
        if (!resultado.success) {
            return res.status(400).json(resultado);
        }
        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    try {
        req.session.destroy((error) => {
            if (error) {
                console.error('Error al cerrar sesión:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al cerrar sesión'
                });
            }
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Cambiar contraseña
router.post('/cambiar-password', AuthBusiness.middlewareAuth, async (req, res) => {
    try {
        const { passwordActual, nuevaPassword } = req.body;
        const usuarioId = req.session.usuario.id;

        // Validar datos requeridos
        if (!passwordActual || !nuevaPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password actual y nueva contraseña son requeridos'
            });
        }

        // Validar longitud de nueva contraseña
        if (nuevaPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const resultado = await AuthBusiness.cambiarPassword(usuarioId, passwordActual, nuevaPassword);
        if (!resultado.success) {
            return res.status(400).json(resultado);
        }

        res.json(resultado);
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar sesión
router.get('/verificar-sesion', (req, res) => {
    try {
        if (req.session && req.session.usuario) {
            res.json({
                success: true,
                usuario: req.session.usuario,
                autenticado: true
            });
        } else {
            res.json({
                success: false,
                message: 'No hay sesión activa',
                autenticado: false
            });
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener perfil del usuario
router.get('/perfil', AuthBusiness.middlewareAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const usuario = await UsuariosData.obtenerPorId(usuarioId);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No enviar la contraseña
        const { password, ...usuarioSinPassword } = usuario;
        
        res.json({
            success: true,
            usuario: usuarioSinPassword
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar perfil
router.put('/perfil', AuthBusiness.middlewareAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const { nombre, telefono } = req.body;

        // Validar datos requeridos
        if (!nombre || !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y teléfono son requeridos'
            });
        }

        const datosActualizacion = {
            nombre: nombre.trim(),
            telefono: telefono.trim()
        };

        const resultado = await UsuariosData.actualizar(usuarioId, datosActualizacion);
        if (!resultado) {
            return res.status(400).json({
                success: false,
                message: 'Error al actualizar el perfil'
            });
        }

        // Actualizar sesión
        req.session.usuario = { ...req.session.usuario, ...datosActualizacion };

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;