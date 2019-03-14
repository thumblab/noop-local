FROM node:alpine
WORKDIR /opt/static
COPY package.json package.json
RUN npm install
COPY server.js server.js
CMD node server.js
