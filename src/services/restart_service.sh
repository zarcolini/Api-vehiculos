#!/bin/bash

set -e

PROJECT_DIR="/ruta/a/tu/proyecto"

PM2_APP_NAME="nombre-de-tu-api-en-pm2"



cd $PROJECT_DIR

echo "-> Actualizando código desde la rama main..."

git fetch origin main
git reset --hard origin/main

echo "-> Instalando dependencias de producción..."
npm install --production

echo "-> Reiniciando el servicio con PM2..."

pm2 reload $PM2_APP_NAME

echo "🚀 ¡Despliegue completado con éxito!"