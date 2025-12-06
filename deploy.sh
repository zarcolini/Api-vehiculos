#!/bin/bash
# Navega a la carpeta de tu proyecto
cd /var/www/mi-api || exit

# Asegúrate de estar en la rama principal
git checkout main
git reset --hard
git pull origin main

# Instala las dependencias de producción
echo "Instalando dependencias..."
npm install --omit=dev

# Reinicia la aplicación con PM2
echo "Reiniciando la aplicación..."
pm2 restart mi-api

echo "¡Despliegue completado!"