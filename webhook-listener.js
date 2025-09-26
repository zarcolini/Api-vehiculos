import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { execFile } from "child_process";

if (!process.env.WEBHOOK_SECRET) {
  console.error(
    "ERROR CRÍTICO: La variable de entorno WEBHOOK_SECRET no está definida."
  );
  process.exit(1);
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const app = express();
const PORT = 1701;

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

const verifyGitHubSignature = (req, res, next) => {
  const signature = req.get("X-Hub-Signature-256");
  if (!signature) {
    return res.status(401).send("Firma no encontrada.");
  }

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);

  const digest = `sha256=${hmac.update(req.rawBody).digest("hex")}`;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send("La firma del webhook es inválida.");
  }

  next();
};

app.post("/webhook", verifyGitHubSignature, (req, res) => {
  if (req.body.ref === "refs/heads/main") {
    console.log("Recibido push a la rama main. Iniciando despliegue...");

    execFile("src/services/restart_service.sh", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el script: ${error}`);
        return res
          .status(500)
          .send("Error en el servidor durante el despliegue.");
      }
      console.log(`Salida del script: ${stdout}`);
      if (stderr) {
        console.error(`Error en la salida estándar: ${stderr}`);
      }
      res.status(200).send("Despliegue iniciado con éxito.");
    });
  } else {
    console.log(
      `Push recibido a la rama ${req.body.ref}, no se requiere acción.`
    );
    res.status(200).send("Push ignorado (no es la rama main).");
  }
});

app.get("/", (req, res) => {
  res.send(
    "Servidor de Webhook escuchando. ¡Listo para recibir notificaciones de GitHub!"
  );
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
