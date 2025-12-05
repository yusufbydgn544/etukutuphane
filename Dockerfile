# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build the React app
RUN npm run build

# Expose port (Cloud Run uses 8080 by default)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
