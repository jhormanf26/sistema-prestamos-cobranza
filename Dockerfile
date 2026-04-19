FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias globales (opcional)
RUN npm install -g npm@latest

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto configurado
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "node", "app.js" ]
