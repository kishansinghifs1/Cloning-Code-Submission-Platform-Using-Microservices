FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
