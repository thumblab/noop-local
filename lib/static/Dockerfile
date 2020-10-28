FROM node:14-alpine
WORKDIR /opt/static
COPY package*.json ./
RUN npm ci
COPY server.js server.js
CMD node server.js
