# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

RUN npm install -g npm@11.2.0

COPY . .
RUN npm run install:all

# Base URL of the demo backend, e.g. /api with API_URL set at run time (see
# demo/10-api-url.conf.template). Empty builds the offline demo without Evaluate.
ARG API_BASE_URL=""
RUN npm run build:demo

# Stage 2: Serve the React app using Nginx
FROM nginx:alpine

# Copy the build files from the previous stage to the NGINX server directory
COPY --from=build /app/dist/demo /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

COPY ./demo/10-api-url.conf.template /etc/nginx/templates/10-api-url.conf.template

# Command to run NGINX when the container starts
CMD ["nginx", "-g", "daemon off;"]
