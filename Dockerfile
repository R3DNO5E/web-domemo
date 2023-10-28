FROM node:20-bookworm-slim
LABEL authors="rednose"



ENTRYPOINT ["top", "-b"]