const { executeQuery, sql } = require('../config/database');

class CitasData {
    
    // Crear nueva cita
    static async crear(cita) {
        try {
            const query = `
                INSERT INTO citas (cliente_id, veterinario_id, mascota_id, fecha_cita, motivo, observaciones)
                OUTPUT INSERTED.id
                VALUES (@cliente_id, @veterinario_id, @mascota_id, @fecha_cita, @motivo, @observaciones)
            `;
            const result = await executeQuery(query, {
                cliente_id: cita.cliente_id,
                veterinario_id: cita.veterinario_id || null,
                mascota_id: cita.mascota_id,
                fecha_cita: cita.fecha_cita,
                motivo: cita.motivo,
                observaciones: cita.observaciones || null
            });
            return result.recordset[0].id;
        } catch (error) {
            console.error('Error al crear cita:', error);
            throw error;
        }
    }

    // Obtener citas por cliente
    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.fecha_cita,
                    c.motivo,
                    c.estado,
                    c.observaciones,
                    c.fecha_creacion,
                    m.nombre as mascota_nombre,
                    m.especie,
                    v.nombre as veterinario_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                LEFT JOIN usuarios v ON c.veterinario_id = v.id
                WHERE c.cliente_id = @clienteId
                ORDER BY c.fecha_cita DESC
            `;
            const result = await executeQuery(query, { clienteId });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener citas por cliente:', error);
            throw error;
        }
    }

    // Obtener citas por veterinario
    static async obtenerPorVeterinario(veterinarioId) {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.fecha_cita,
                    c.motivo,
                    c.estado,
                    c.observaciones,
                    c.fecha_creacion,
                    m.nombre as mascota_nombre,
                    m.especie,
                    m.raza,
                    u.nombre as cliente_nombre,
                    u.telefono as cliente_telefono
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON c.cliente_id = u.id
                WHERE c.veterinario_id = @veterinarioId
                ORDER BY c.fecha_cita ASC
            `;
            const result = await executeQuery(query, { veterinarioId });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener citas por veterinario:', error);
            throw error;
        }
    }

    // Obtener todas las citas (para admin)
    static async obtenerTodas() {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.fecha_cita,
                    c.motivo,
                    c.estado,
                    c.observaciones,
                    c.fecha_creacion,
                    m.nombre as mascota_nombre,
                    m.especie,
                    u.nombre as cliente_nombre,
                    v.nombre as veterinario_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON c.cliente_id = u.id
                LEFT JOIN usuarios v ON c.veterinario_id = v.id
                ORDER BY c.fecha_cita DESC
            `;
            const result = await executeQuery(query);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener todas las citas:', error);
            throw error;
        }
    }

    // Obtener cita por ID
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT 
                    c.*,
                    m.nombre as mascota_nombre,
                    m.especie,
                    m.raza,
                    u.nombre as cliente_nombre,
                    u.email as cliente_email,
                    u.telefono as cliente_telefono,
                    v.nombre as veterinario_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON c.cliente_id = u.id
                LEFT JOIN usuarios v ON c.veterinario_id = v.id
                WHERE c.id = @id
            `;
            const result = await executeQuery(query, { id });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error al obtener cita por ID:', error);
            throw error;
        }
    }

    // Actualizar estado de cita
    static async actualizarEstado(id, estado, observaciones = null) {
        try {
            const query = `
                UPDATE citas 
                SET estado = @estado, 
                    observaciones = COALESCE(@observaciones, observaciones),
                    fecha_actualizacion = GETDATE()
                WHERE id = @id
            `;
            const result = await executeQuery(query, { 
                id, 
                estado, 
                observaciones 
            });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al actualizar estado de cita:', error);
            throw error;
        }
    }

    // Asignar veterinario a cita
    static async asignarVeterinario(citaId, veterinarioId) {
        try {
            const query = `
                UPDATE citas 
                SET veterinario_id = @veterinarioId,
                    estado = 'confirmada',
                    fecha_actualizacion = GETDATE()
                WHERE id = @citaId
            `;
            const result = await executeQuery(query, { 
                citaId, 
                veterinarioId 
            });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al asignar veterinario:', error);
            throw error;
        }
    }

    // Obtener estadísticas de citas
    static async obtenerEstadisticas() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_citas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                    COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
                    COUNT(CASE WHEN estado = 'en_curso' THEN 1 END) as en_curso,
                    COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                    COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
                    COUNT(CASE WHEN CAST(fecha_cita AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) as hoy
                FROM citas
                WHERE fecha_cita >= DATEADD(MONTH, -1, GETDATE())
            `;
            const result = await executeQuery(query);
            return result.recordset[0];
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    // Obtener citas del día
    static async obtenerCitasDelDia() {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.fecha_cita,
                    c.motivo,
                    c.estado,
                    m.nombre as mascota_nombre,
                    u.nombre as cliente_nombre,
                    v.nombre as veterinario_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON c.cliente_id = u.id
                LEFT JOIN usuarios v ON c.veterinario_id = v.id
                WHERE CAST(c.fecha_cita AS DATE) = CAST(GETDATE() AS DATE)
                ORDER BY c.fecha_cita ASC
            `;
            const result = await executeQuery(query);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener citas del día:', error);
            throw error;
        }
    }
}

module.exports = CitasData;