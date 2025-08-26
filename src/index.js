// Archivo principal (index.js o app.js)

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import ventasRoutes from './routes/ventas.routes.js';
import './db.js';

const app = express();
const cleanAndParseJSON = (req, res, next) => {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
        return next();
    }

   
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ message: 'Unsupported Media Type: Se esperaba application/json.' });
    }

    let rawData = '';
    req.on('data', chunk => {
        rawData += chunk;
    });

    req.on('end', () => {
        if (!rawData.trim()) {
            req.body = {}; 
            return next();
        }

        try {
            console.log('JSON crudo recibido:', rawData);
            
           
            let cleanedData = rawData
                .replace(/:\s*,/g, ': null,')
                .replace(/:\s*}/g, ': null}') 
                .replace(/,(\s*[}\]])/g, '$1'); 

            if (cleanedData !== rawData) {
                console.log('JSON limpiado:', cleanedData);
            }
            

            req.body = JSON.parse(cleanedData);

            
            next();
        } catch (error) {
            console.error('Error de análisis de JSON inválido:', error.message);
           
            res.status(400).json({ 
                status: 'error', 
                message: 'JSON malformado. Por favor, verifique la sintaxis.',
                raw_body: rawData 
            });
        }
    });
};

console.log("🔐 Clave maestra cargada:", process.env.MASTER_API_KEY);

app.use((req, res, next) => {
    console.log(`>>> Solicitud Recibida: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(cors());


app.use(cleanAndParseJSON);


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