FROM node:19

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 7001

CMD ["npm", "start"]