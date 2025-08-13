import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import ventasRoutes from './routes/ventas.routes.js';
import './db.js';

const app = express();

console.log("🔐 Clave maestra cargada:", process.env.MASTER_API_KEY);


app.use((req, res, next) => {
    console.log(`>>> Solicitud Recibida: ${req.method} ${req.originalUrl}`);
    next();
});


app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', ventasRoutes);


app.use((req, res, next) => {
    res.status(404).json({
        message: 'Endpoint no encontrado'
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de solo lectura corriendo en el puerto ${PORT}`);
    console.log(`🗄️  Base de datos: MariaDB en ${process.env.DB_HOST}`);
});