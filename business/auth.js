const bcrypt = require('bcrypt');
const UsuariosData = require('../data/usuarios');

class AuthBusiness {
    
    static async autenticar(email, password) {
        try {
            const usuario = await UsuariosData.obtenerPorEmail(email);
            
            if (!usuario) {
                return {
                    success: false,
                    message: 'Email o contraseña incorrectos'
                };
            }

            // Verificar contraseña
            const passwordValida = await bcrypt.compare(password, usuario.password);
            
            if (!passwordValida) {
                return {
                    success: false,
                    message: 'Email o contraseña incorrectos'
                };
            }

            // Retornar datos del usuario (sin contraseña)
            const { password: _, ...usuarioSinPassword } = usuario;
            
            return {
                success: true,
                usuario: usuarioSinPassword,
                message: 'Autenticación exitosa'
            };
            
        } catch (error) {
            console.error('Error en autenticación:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Registrar nuevo usuario
    static async registrar(datosUsuario) {
        try {
            // Verificar si el email ya existe
            const usuarioExistente = await UsuariosData.obtenerPorEmail(datosUsuario.email);
            
            if (usuarioExistente) {
                return {
                    success: false,
                    message: 'El email ya está registrado'
                };
            }

            // Validar datos requeridos
            if (!datosUsuario.nombre || !datosUsuario.email || !datosUsuario.password) {
                return {
                    success: false,
                    message: 'Nombre, email y contraseña son requeridos'
                };
            }

            // Validar formato de email
            if (!this.validarEmail(datosUsuario.email)) {
                return {
                    success: false,
                    message: 'Formato de email inválido'
                };
            }

            // Validar fortaleza de contraseña
            if (!this.validarPassword(datosUsuario.password)) {
                return {
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                };
            }

            // Encriptar contraseña
            const saltRounds = 10;
            const passwordEncriptada = await bcrypt.hash(datosUsuario.password, saltRounds);

            // Crear usuario
            const nuevoUsuario = {
                nombre: datosUsuario.nombre.trim(),
                email: datosUsuario.email.toLowerCase().trim(),
                password: passwordEncriptada,
                rol: datosUsuario.rol || 'cliente',
                telefono: datosUsuario.telefono?.trim() || null
            };

            const usuarioId = await UsuariosData.crear(nuevoUsuario);

            return {
                success: true,
                usuarioId,
                message: 'Usuario registrado exitosamente'
            };

        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Cambiar contraseña
    static async cambiarPassword(usuarioId, passwordActual, nuevaPassword) {
        try {
            // Obtener usuario
            const usuario = await UsuariosData.obtenerPorId(usuarioId);
            
            if (!usuario) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Verificar contraseña actual
            const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
            
            if (!passwordValida) {
                return {
                    success: false,
                    message: 'Contraseña actual incorrecta'
                };
            }

            // Validar nueva contraseña
            if (!this.validarPassword(nuevaPassword)) {
                return {
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                };
            }

            // Encriptar nueva contraseña
            const saltRounds = 10;
            const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, saltRounds);

            // Actualizar contraseña
            const actualizado = await UsuariosData.actualizarPassword(usuarioId, nuevaPasswordEncriptada);

            if (!actualizado) {
                return {
                    success: false,
                    message: 'Error al actualizar contraseña'
                };
            }

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Validar formato de email
    static validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Validar fortaleza de contraseña
    static validarPassword(password) {
        return password && password.length >= 6;
    }

    // Verificar si usuario está autenticado
    static verificarAutenticacion(req) {
        return req.session && req.session.usuario;
    }

    // Verificar rol de usuario
    static verificarRol(req, rolesPermitidos) {
        if (!this.verificarAutenticacion(req)) {
            return false;
        }
        
        const rolUsuario = req.session.usuario.rol;
        return rolesPermitidos.includes(rolUsuario);
    }

    // Middleware de autenticación
    static middlewareAuth(req, res, next) {
        if (!AuthBusiness.verificarAutenticacion(req)) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }
        next();
    }

    // Middleware de autorización por rol
    static middlewareRol(rolesPermitidos) {
        return (req, res, next) => {
            if (!AuthBusiness.verificarRol(req, rolesPermitidos)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }
            next();
        };
    }
}

module.exports = AuthBusiness;