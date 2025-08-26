import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import ventasRoutes from './routes/ventas.routes.js';
import './db.js';

const app = express();


// Middleware para limpiar JSON malformado ANTES de que Express lo parsee
const cleanMalformedJSON = (req, res, next) => {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      if (!body.trim()) {
        req.body = {};
        return next();
      }
      
      console.log('JSON recibido:', body);
      
      // Limpiar campos vacíos malformados
      let cleanedBody = body
        .replace(/:\s*,/g, ': null,')           // "campo":, -> "campo": null,
        .replace(/:\s*}/g, ': null}')           // "campo":} -> "campo": null}
        .replace(/:\s*]/g, ': null]')           // "campo":] -> "campo": null]
        .replace(/,(\s*[}\]])/g, '$1')          // Comas finales sobrantes
        .replace(/:\s*$/gm, ': null')           // "campo": al final de línea
        .replace(/,\s*\n\s*}/g, '\n}')          // Coma antes de }
        .replace(/,\s*\n\s*]/g, '\n]');         // Coma antes de ]
      
      // Si hubo cambios, loggearlos
      if (cleanedBody !== body) {
        console.log('JSON limpiado:', cleanedBody);
      }
      
      // Parsear JSON limpio
      req.body = JSON.parse(cleanedBody);
      
      // Filtrar valores null que creamos
      req.body = filterNullValues(req.body);
      
      console.log('Objeto final después de limpiar:', req.body);
      
    } catch (error) {
      console.error('Error al limpiar JSON:', error.message);
      req.body = {};
    }
    
    next();
  });
};

// Función helper para filtrar valores null recursivamente
const filterNullValues = (obj) => {
  if (Array.isArray(obj)) {
    return obj.filter(item => item !== null && item !== undefined)
              .map(item => typeof item === 'object' ? filterNullValues(item) : item);
  }
  
  if (obj && typeof obj === 'object') {
    const filtered = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && 
          value !== undefined && 
          value !== '' && 
          !(Array.isArray(value) && value.length === 0) &&
          value !== 'null' &&
          value !== 'undefined') {
        
        if (typeof value === 'object') {
          const nestedFiltered = filterNullValues(value);
          if (Object.keys(nestedFiltered).length > 0 || Array.isArray(nestedFiltered)) {
            filtered[key] = nestedFiltered;
          }
        } else {
          filtered[key] = value;
        }
      } else {
        console.log(`Campo vacío filtrado: ${key} = ${value}`);
      }
    }
    return filtered;
  }
  
  return obj;
};

export { cleanMalformedJSON };
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