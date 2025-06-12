const { executeQuery, sql } = require('../config/database');

class MensajesData {
    
    // Crear nuevo mensaje
    static async crear(mensaje) {
        try {
            const query = `
                INSERT INTO mensajes (cita_id, usuario_id, mensaje)
                OUTPUT INSERTED.id, INSERTED.fecha_envio
                VALUES (@cita_id, @usuario_id, @mensaje)
            `;
            const result = await executeQuery(query, {
                cita_id: mensaje.cita_id,
                usuario_id: mensaje.usuario_id,
                mensaje: mensaje.mensaje
            });
            return result.recordset[0];
        } catch (error) {
            console.error('Error al crear mensaje:', error);
            throw error;
        }
    }

    // Obtener mensajes por cita
    static async obtenerPorCita(citaId) {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.mensaje,
                    m.fecha_envio,
                    m.leido,
                    u.nombre as usuario_nombre,
                    u.rol as usuario_rol
                FROM mensajes m
                INNER JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.cita_id = @citaId
                ORDER BY m.fecha_envio ASC
            `;
            const result = await executeQuery(query, { citaId });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener mensajes por cita:', error);
            throw error;
        }
    }

    // Marcar mensajes como leídos
    static async marcarComoLeidos(citaId, usuarioId) {
        try {
            const query = `
                UPDATE mensajes 
                SET leido = 1 
                WHERE cita_id = @citaId 
                AND usuario_id != @usuarioId 
                AND leido = 0
            `;
            const result = await executeQuery(query, { 
                citaId, 
                usuarioId 
            });
            return result.rowsAffected[0];
        } catch (error) {
            console.error('Error al marcar mensajes como leídos:', error);
            throw error;
        }
    }

    // Obtener mensajes no leídos por usuario
    static async obtenerNoLeidos(usuarioId) {
        try {
            const query = `
                SELECT 
                    m.cita_id,
                    COUNT(*) as mensajes_no_leidos,
                    c.motivo as cita_motivo,
                    ma.nombre as mascota_nombre
                FROM mensajes m
                INNER JOIN citas c ON m.cita_id = c.id
                INNER JOIN mascotas ma ON c.mascota_id = ma.id
                WHERE m.leido = 0 
                AND m.usuario_id != @usuarioId
                AND (c.cliente_id = @usuarioId OR c.veterinario_id = @usuarioId)
                GROUP BY m.cita_id, c.motivo, ma.nombre
            `;
            const result = await executeQuery(query, { usuarioId });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener mensajes no leídos:', error);
            throw error;
        }
    }

    // Obtener últimos mensajes por usuario
    static async obtenerUltimosPorUsuario(usuarioId, limite = 10) {
        try {
            const query = `
                SELECT TOP (@limite)
                    m.id,
                    m.mensaje,
                    m.fecha_envio,
                    m.cita_id,
                    u.nombre as usuario_nombre,
                    u.rol as usuario_rol,
                    c.motivo as cita_motivo,
                    ma.nombre as mascota_nombre
                FROM mensajes m
                INNER JOIN usuarios u ON m.usuario_id = u.id
                INNER JOIN citas c ON m.cita_id = c.id
                INNER JOIN mascotas ma ON c.mascota_id = ma.id
                WHERE c.cliente_id = @usuarioId OR c.veterinario_id = @usuarioId
                ORDER BY m.fecha_envio DESC
            `;
            const result = await executeQuery(query, { 
                usuarioId, 
                limite 
            });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener últimos mensajes:', error);
            throw error;
        }
    }

    // Eliminar mensaje
    static async eliminar(id) {
        try {
            const query = `DELETE FROM mensajes WHERE id = @id`;
            const result = await executeQuery(query, { id });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al eliminar mensaje:', error);
            throw error;
        }
    }
}

module.exports = MensajesData;