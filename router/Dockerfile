FROM node:14-alpine
WORKDIR /router
COPY package*.json ./
RUN npm ci
COPY *.js .
COPY lib/ lib/
CMD node server.js
