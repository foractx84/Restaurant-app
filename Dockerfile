#-----------------------------------------------------------------------------------------------------------------------
# Dependencies stage
FROM node:24.12.0-slim as builder

# Install native build dependencies for bcrypt and other native modules
USER root
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set user and working directory
USER node
WORKDIR /app

# NPM Settings
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# Install production dependencies
COPY --chown=node:node ./package*.json ./

RUN npm install -g typescript tsc-alias && \
    npm install --omit=dev --ignore-scripts && \
    npm rebuild bcrypt sharp

# Copy app's source code
COPY ./.env ./.env
COPY ./src ./src
COPY ./tsconfig.json ./

# Build app
RUN npm run build

#-----------------------------------------------------------------------------------------------------------------------
# Dependencies stage
FROM node:24.12.0-slim as runner

# Set user and working directory
USER node
WORKDIR /app

# Copy built app and dependencies from previous stage
COPY --from=builder --chown=node:node /app/.env /app/.env
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/dist /app/dist

# Open port to serve API traffic
EXPOSE 3000

# Start App
ENTRYPOINT ["node", "/app/dist/server.js"]
