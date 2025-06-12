const { executeQuery, sql } = require('../config/database');

class UsuariosData {
    
    // Obtener usuario por email
    static async obtenerPorEmail(email) {
        try {
            const query = `
                SELECT id, nombre, email, password, rol, telefono, fecha_registro, activo 
                FROM usuarios 
                WHERE email = @email AND activo = 1
            `;
            const result = await executeQuery(query, { email });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error al obtener usuario por email:', error);
            throw error;
        }
    }

    // Obtener usuario por ID
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT id, nombre, email, rol, telefono, fecha_registro, activo 
                FROM usuarios 
                WHERE id = @id AND activo = 1
            `;
            const result = await executeQuery(query, { id });
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error al obtener usuario por ID:', error);
            throw error;
        }
    }

    // Crear nuevo usuario
    static async crear(usuario) {
        try {
            const query = `
                INSERT INTO usuarios (nombre, email, password, rol, telefono)
                OUTPUT INSERTED.id
                VALUES (@nombre, @email, @password, @rol, @telefono)
            `;
            const result = await executeQuery(query, {
                nombre: usuario.nombre,
                email: usuario.email,
                password: usuario.password,
                rol: usuario.rol,
                telefono: usuario.telefono || null
            });
            return result.recordset[0].id;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    // Actualizar contraseña
    static async actualizarPassword(id, nuevaPassword) {
        try {
            const query = `
                UPDATE usuarios 
                SET password = @password 
                WHERE id = @id
            `;
            const result = await executeQuery(query, { 
                id, 
                password: nuevaPassword 
            });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            throw error;
        }
    }

    // Obtener todos los veterinarios
    static async obtenerVeterinarios() {
        try {
            const query = `
                SELECT id, nombre, email, telefono 
                FROM usuarios 
                WHERE rol = 'veterinario' AND activo = 1
                ORDER BY nombre
            `;
            const result = await executeQuery(query);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener veterinarios:', error);
            throw error;
        }
    }

    // Obtener todos los clientes
    static async obtenerClientes() {
        try {
            const query = `
                SELECT id, nombre, email, telefono, fecha_registro 
                FROM usuarios 
                WHERE rol = 'cliente' AND activo = 1
                ORDER BY nombre
            `;
            const result = await executeQuery(query);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            throw error;
        }
    }

    // Desactivar usuario
    static async desactivar(id) {
        try {
            const query = `
                UPDATE usuarios 
                SET activo = 0 
                WHERE id = @id
            `;
            const result = await executeQuery(query, { id });
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            throw error;
        }
    }
}

module.exports = UsuariosData;