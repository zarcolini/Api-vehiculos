import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import ventasRoutes from './src/routes/ventas.routes.js';

const app = express();

console.log("🔐 Clave maestra cargada:", process.env.MASTER_API_KEY);

// Middleware para logging de solicitudes
app.use((req, res, next) => {
    console.log(`>>> Solicitud Recibida: ${req.method} ${req.originalUrl}`);
    next();
});

// Middlewares principales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', ventasRoutes);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({
        message: 'Endpoint no encontrado'
    });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor de solo lectura corriendo en el puerto ${PORT}`);
        console.log(`🗄️  Base de datos: MariaDB en ${process.env.DB_HOST}`);
    });
}

// Exportación para Vercel (serverless)
export default app;