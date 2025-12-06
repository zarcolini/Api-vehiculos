import express from 'express';
import { exec } from 'child_process';
import crypto from 'crypto';

const app = express();
const PORT = 3001; // Un puerto diferente al de tu API principal
const WEBHOOK_SECRET = 'HsQWQLpi5JoaBHT3uJie7nJebNUrou8W3FHw0y6HKIFiRwh6PnIwqeX8aj9lwOpYqEISi5JwaaQlLNLpmvRexOW4V0lEe9T1LMejKKh3VXw803l14Czip0hnpyUDrcwv'; // ¡Cambia esto!

app.use(express.json());

// Middleware para verificar la firma de GitHub
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).send('Firma no encontrada');
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        return res.status(401).send('Firma inválida');
    }

    next();
};

// La ruta que escuchará a GitHub
app.post('/git-webhook', verifySignature, (req, res) => {
    // Solo actuar en pushes a la rama 'main'
    if (req.body.ref === 'refs/heads/main') {
        console.log('Push a la rama main detectado. Iniciando despliegue...');

        exec('./deploy.sh', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error en el script: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Error de ejecución: ${stderr}`);
                return;
            }
            console.log(`Script ejecutado con éxito: ${stdout}`);
        });

        res.status(200).send('Despliegue iniciado.');
    } else {
        res.status(200).send('Push ignorado (no es la rama main).');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Webhook escuchando en el puerto ${PORT}`);
});