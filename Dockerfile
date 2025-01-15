# Base image for build.
FROM node:18.20-alpine3.20 AS build

# Set environment variables and increase memory limit for Node.js.
ENV NODE_OPTIONS="--max_old_space_size=8192" \
    PATH="/app/node_modules/.bin:$PATH"

# Define the working directory.
WORKDIR /app

# Copy and install dependencies first to leverage Docker cache.
COPY package.json package-lock.json /app/
COPY .npmrc /app/

RUN npm ci --prefer-offline --no-audit

# Copy application files and build the project.
COPY . /app
#  app_env provided as build-arg. Default to production.
ARG app_env="production" 
RUN npm run build-$app_env

# Use nginx for serving static files in the production environment.
FROM nginx:stable-alpine

# Copy custom nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Clear default nginx html directory and copy build files from the build stage.
RUN rm -rf /usr/share/nginx/html/* 
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the necessary port and set the entrypoint.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
