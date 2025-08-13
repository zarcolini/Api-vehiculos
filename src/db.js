import mysql from 'mysql2/promise';
import 'dotenv/config';

// Variables de entorno requeridas para MariaDB
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'DB_PORT', 'MASTER_API_KEY'];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`❌ Error Crítico: La variable de entorno ${varName} no está definida.`);
        console.error('Por favor, revisa que tu archivo .env esté en la raíz del proyecto y contenga todas las variables necesarias.');
        process.exit(1);
    }
}

const dbSettings = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    waitForConnections: true,
    reconnect: true
};

export async function getConnection() {
    try {
        const pool = mysql.createPool(dbSettings);
        
        // Probar la conexión
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MariaDB establecida correctamente.');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('❌ Error al conectar con MariaDB:', error.message);
        process.exit(1);
    }
}

export const db = await getConnection();