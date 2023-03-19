FROM node:16
WORKDIR /admin_server
COPY ["package.json", "package-lock.json", "./"]
RUN npm install
COPY . .

EXPOSE 5000
CMD ["node", "app.js"]