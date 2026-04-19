FROM node:20-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto configurado
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "npm", "start" ]
