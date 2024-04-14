# syntax=docker/dockerfile:1

# Use an official Node.js runtime as the base image
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN npm install

# Command to run the application
CMD ["node", "server.js"]

# Expose port 8000
EXPOSE 3000