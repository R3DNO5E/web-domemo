FROM node:20-bookworm-slim
LABEL authors="rednose"

COPY client /app/client/
COPY common /app/common/
COPY server /app/server/

WORKDIR /app/client
CMD ["npm", "install"]
CMD ["npm", "run", "build"]

ENTRYPOINT ["bash"]