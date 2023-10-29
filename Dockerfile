FROM node:20-bookworm-slim
LABEL authors="rednose"
EXPOSE 3000/tcp

COPY client /app/client/
COPY common /app/common/
COPY server /app/server/

WORKDIR /app/server
RUN ["npm", "install", "--omit=dev"]

ENTRYPOINT ["npm", "start"]
