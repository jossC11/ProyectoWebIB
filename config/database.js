const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

// Función para obtener la conexión
async function getConnection() {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log('✅ Conexión a SQL Server establecida correctamente');
        }
        return pool;
    } catch (error) {
        console.error('❌ Error al conectar con SQL Server:', error);
        throw error;
    }
}

// Función para cerrar la conexión
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('🔐 Conexión a SQL Server cerrada');
        }
    } catch (error) {
        console.error('❌ Error al cerrar la conexión:', error);
    }
}

// Función para ejecutar consultas
async function executeQuery(query, params = {}) {
    try {
        const connection = await getConnection();
        const request = connection.request();
        
        // Agregar parámetros si existen
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('❌ Error ejecutando consulta:', error);
        throw error;
    }
}

// Manejar el cierre de la aplicación
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

module.exports = {
    getConnection,
    closeConnection,
    executeQuery,
    sql
};