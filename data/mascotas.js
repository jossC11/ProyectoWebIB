const { executeQuery, sql } = require('../config/database');

class MascotasData {
    
    // Crear nueva mascota
    static async crear(mascota) {
        try {
            const query = `
                INSERT INTO mascotas (nombre, especie, raza, edad, peso, propietario_id)
                OUTPUT INSERTED.id
                VALUES (@nombre, @especie, @raza, @edad, @peso, @propietario_id)
            `;
            const result = await executeQuery(query, {
                nombre: mascota.nombre,
                especie: mascota.especie,
                raza: mascota.raza || null,
                edad: mascota.edad || null,
                peso: mascota.peso || null,
                propietario_id: mascota.propietario_id
            });
            return result.recordset[0].id;
        } catch (error) {
            console.error('Error al crear mascota:', error);
            throw error;
        }
    }

    // Obtener mascotas por propietario
    static async obtenerPorPropietario(propietarioId) {
        try {
            const query = `
                SELECT 
                    id, 
                    nombre, 
                    especie, 
                    raza, 
                    edad, 
                    peso, 
                    fecha_registro
                FROM mascotas 
                WHERE propietario_id = @propietarioId
                ORDER BY nombre
            `;
            const result = await executeQuery(query, { propietarioId });
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener mascotas por propietario:', error);
            throw error;
        }
    }

    // Obtener mascota por ID
    static async obtenerPorId(id) {
        const query = `
            SELECT m.*, u.nombre as propietario_nombre
            FROM mascotas m
            INNER JOIN usuarios u ON m.propietario_id = u.id
            WHERE m.id = @id
        `;
        const result = await executeQuery(query, { id });
        return result.recordset[0]; // debe incluir propietario_id
    }

    // Actualizar mascota
    static async actualizar(id, mascota) {
        try {
            const query = `
                UPDATE mascotas 
                SET nombre = @nombre,
                    especie = @especie,
                    raza = @raza,
                    edad = @edad,
                    peso = @peso
                WHERE id = @id
            `;
            const result = await executeQuery(query, {
                id,
                nombre: mascota.nombre,
                especie: mascota.especie,
                raza: mascota.raza || null,
                edad: mascota.edad || null,
                peso: mascota.peso || null
            });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al actualizar mascota:', error);
            throw error;
        }
    }

    // Obtener todas las mascotas (para admin)
    static async obtenerTodas() {
        try {
            const query = `
                SELECT 
                    m.*,
                    u.nombre as propietario_nombre,
                    u.email as propietario_email,
                    u.telefono as propietario_telefono
                FROM mascotas m
                INNER JOIN usuarios u ON m.propietario_id = u.id
                ORDER BY m.nombre
            `;
            const result = await executeQuery(query);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener todas las mascotas:', error);
            throw error;
        }
    }

    // Eliminar mascota
    static async eliminar(id) {
        try {
            const query = `DELETE FROM mascotas WHERE id = @id`;
            const result = await executeQuery(query, { id });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al eliminar mascota:', error);
            throw error;
        }
    }
}

module.exports = MascotasData;