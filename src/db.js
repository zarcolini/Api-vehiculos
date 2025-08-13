import mysql from 'mysql2/promise';
import 'dotenv/config';

// Variables de entorno requeridas para MariaDB
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'MASTER_API_KEY'];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`❌ Error Crítico: La variable de entorno ${varName} no está definida.`);
        console.error('Por favor, revisa que las variables de entorno estén configuradas en Vercel.');
        throw new Error(`Variable de entorno ${varName} no definida`);
    }
}

const dbSettings = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    // Configuración optimizada para serverless
    connectionLimit: 1,
    queueLimit: 0,
    acquireTimeout: 10000,
    waitForConnections: true,
    reconnect: true,
    // Configuraciones adicionales para estabilidad
    ssl: false,
    charset: 'utf8mb4'
};

let pool;

export async function getConnection() {
    if (!pool) {
        try {
            pool = mysql.createPool(dbSettings);
            console.log('✅ Pool de conexiones a MariaDB creado correctamente.');
        } catch (error) {
            console.error('❌ Error al crear el pool de conexiones MariaDB:', error.message);
            throw error;
        }
    }
    return pool;
}

// Función para obtener una sola conexión (mejor para serverless)
export async function query(sql, params = []) {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ Error en consulta de base de datos:', error.message);
        throw error;
    }
}

export const db = await getConnection();