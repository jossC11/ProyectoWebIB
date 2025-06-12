const MensajesData = require('../data/mensajes');
const CitasData = require('../data/citas');

class ChatBusiness {
    
    // Enviar mensaje
    static async enviarMensaje(datosMensaje, usuarioId, rolUsuario) {
        try {
            // Validar datos requeridos
            if (!datosMensaje.cita_id || !datosMensaje.mensaje) {
                return {
                    success: false,
                    message: 'Cita y mensaje son requeridos'
                };
            }

            // Validar que el mensaje no esté vacío
            const mensajeLimpio = datosMensaje.mensaje.trim();
            if (!mensajeLimpio) {
                return {
                    success: false,
                    message: 'El mensaje no puede estar vacío'
                };
            }

            // Validar longitud del mensaje
            if (mensajeLimpio.length > 1000) {
                return {
                    success: false,
                    message: 'El mensaje es demasiado largo (máximo 1000 caracteres)'
                };
            }

            // Verificar que la cita existe y el usuario tiene permisos
            const cita = await CitasData.obtenerPorId(datosMensaje.cita_id);
            
            if (!cita) {
                return {
                    success: false,
                    message: 'Cita no encontrada'
                };
            }

            // Verificar permisos (solo cliente, veterinario asignado o admin)
            const tienePermiso = rolUsuario === 'admin' || 
                                cita.cliente_id === usuarioId || 
                                cita.veterinario_id === usuarioId;

            if (!tienePermiso) {
                return {
                    success: false,
                    message: 'No tienes permisos para enviar mensajes en esta cita'
                };
            }

            // Crear mensaje
            const nuevoMensaje = {
                cita_id: datosMensaje.cita_id,
                usuario_id: usuarioId,
                mensaje: mensajeLimpio
            };

            const mensajeCreado = await MensajesData.crear(nuevoMensaje);

            return {
                success: true,
                mensaje: {
                    id: mensajeCreado.id,
                    mensaje: mensajeLimpio,
                    fecha_envio: mensajeCreado.fecha_envio,
                    usuario_id: usuarioId
                },
                message: 'Mensaje enviado exitosamente'
            };

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Obtener mensajes de una cita
    static async obtenerMensajes(citaId, usuarioId, rolUsuario) {
        try {
            // Verificar que la cita existe y el usuario tiene permisos
            const cita = await CitasData.obtenerPorId(citaId);
            
            if (!cita) {
                return {
                    success: false,
                    message: 'Cita no encontrada'
                };
            }

            // Verificar permisos
            const tienePermiso = rolUsuario === 'admin' || 
                                cita.cliente_id === usuarioId || 
                                cita.veterinario_id === usuarioId;

            if (!tienePermiso) {
                return {
                    success: false,
                    message: 'No tienes permisos para ver estos mensajes'
                };
            }

            // Obtener mensajes
            const mensajes = await MensajesData.obtenerPorCita(citaId);

            // Marcar mensajes como leídos
            await MensajesData.marcarComoLeidos(citaId, usuarioId);

            return {
                success: true,
                mensajes,
                cita: {
                    id: cita.id,
                    motivo: cita.motivo,
                    mascota_nombre: cita.mascota_nombre,
                    cliente_nombre: cita.cliente_nombre,
                    veterinario_nombre: cita.veterinario_nombre
                }
            };

        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Obtener mensajes no leídos
    static async obtenerMensajesNoLeidos(usuarioId) {
        try {
            const mensajesNoLeidos = await MensajesData.obtenerNoLeidos(usuarioId);

            return {
                success: true,
                mensajes_no_leidos: mensajesNoLeidos
            };

        } catch (error) {
            console.error('Error al obtener mensajes no leídos:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Obtener últimos mensajes del usuario
    static async obtenerUltimosMensajes(usuarioId, limite = 10) {
        try {
            const ultimosMensajes = await MensajesData.obtenerUltimosPorUsuario(usuarioId, limite);

            return {
                success: true,
                mensajes: ultimosMensajes
            };

        } catch (error) {
            console.error('Error al obtener últimos mensajes:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Validar acceso a sala de chat
    static async validarAccesoSala(citaId, usuarioId, rolUsuario) {
        try {
            const cita = await CitasData.obtenerPorId(citaId);
            
            if (!cita) {
                return {
                    acceso: false,
                    message: 'Cita no encontrada'
                };
            }

            const tieneAcceso = rolUsuario === 'admin' || 
                               cita.cliente_id === usuarioId || 
                               cita.veterinario_id === usuarioId;

            return {
                acceso: tieneAcceso,
                cita: tieneAcceso ? {
                    id: cita.id,
                    motivo: cita.motivo,
                    mascota_nombre: cita.mascota_nombre,
                    cliente_nombre: cita.cliente_nombre,
                    veterinario_nombre: cita.veterinario_nombre,
                    estado: cita.estado
                } : null,
                message: tieneAcceso ? 'Acceso autorizado' : 'Acceso denegado'
            };

        } catch (error) {
            console.error('Error al validar acceso a sala:', error);
            return {
                acceso: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Obtener participantes de una cita
    static async obtenerParticipantes(citaId) {
        try {
            const cita = await CitasData.obtenerPorId(citaId);
            
            if (!cita) {
                return {
                    success: false,
                    message: 'Cita no encontrada'
                };
            }

            const participantes = [
                {
                    id: cita.cliente_id,
                    nombre: cita.cliente_nombre,
                    rol: 'cliente'
                }
            ];

            if (cita.veterinario_id) {
                participantes.push({
                    id: cita.veterinario_id,
                    nombre: cita.veterinario_nombre,
                    rol: 'veterinario'
                });
            }

            return {
                success: true,
                participantes
            };

        } catch (error) {
            console.error('Error al obtener participantes:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }

    // Filtrar y sanitizar mensaje
    static sanitizarMensaje(mensaje) {
        if (!mensaje || typeof mensaje !== 'string') {
            return '';
        }

        // Remover caracteres peligrosos y limpiar
        return mensaje
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .substring(0, 1000);
    }

    // Validar formato de mensaje
    static validarMensaje(mensaje) {
        const mensajeLimpio = this.sanitizarMensaje(mensaje);
        
        return {
            valido: mensajeLimpio.length > 0 && mensajeLimpio.length <= 1000,
            mensaje: mensajeLimpio,
            error: mensajeLimpio.length === 0 ? 'Mensaje vacío' : 
                   mensajeLimpio.length > 1000 ? 'Mensaje demasiado largo' : null
        };
    }
}

module.exports = ChatBusiness;