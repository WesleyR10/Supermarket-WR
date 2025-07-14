FROM node:20.5.1-slim

RUN npm install -g @nestjs/cli@10.1.17

# Instalar git-flow
RUN apt-get update && apt-get install -y git-flow && rm -rf /var/lib/apt/lists/*

#Utilizado para não trabalhar com root, visando segurança e evitar problemas de permissões
USER node 

WORKDIR /home/node/app

CMD ["tail", "-f", "/dev/null"] 