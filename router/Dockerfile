FROM node:alpine
COPY package.json package.json
RUN npm install
COPY server.js server.js
COPY certificates/ certificates/
CMD node server.js
