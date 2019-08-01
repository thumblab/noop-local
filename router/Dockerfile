FROM node:slim
WORKDIR /router
COPY package.json package.json
RUN npm install
COPY *.js .
COPY certificates/ certificates/
COPY lib/ lib/
CMD node server.js
