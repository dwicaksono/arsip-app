#!/bin/bash

# Arsip App Backend Setup Script

echo "Setting up Arsip App Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v22 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "Node.js version $NODE_VERSION detected. Please use Node.js v22 or higher."
    echo "You can use nvm: nvm use 22"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "Created uploads directory."
fi

# Check if .env file exists, if not, copy from .env.example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Created .env file from .env.example. Please update the DATABASE_URL with your Neon PostgreSQL credentials."
    else
        echo "No .env.example file found. Please create a .env file manually."
    fi
fi

# Generate database schema
echo "Generating database schema..."
npm run db:generate

echo "Setup completed successfully!"
echo "Next steps:"
echo "1. Update the .env file with your Neon PostgreSQL credentials"
echo "2. Run 'npm run db:push' to push the schema to your database"
echo "3. Run 'npm run dev' to start the development server"
