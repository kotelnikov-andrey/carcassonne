# Carcassonne Game with PostgreSQL Storage

A digital implementation of the Carcassonne board game with a React frontend, Node.js backend, and PostgreSQL database for persistent storage.

## Quick Start Guide

Follow these steps to get the project up and running:

### Step 1: Start PostgreSQL Database with Docker

```bash
# Make sure Docker is running on your system
# Then start the PostgreSQL container
docker-compose up -d
```

This command starts a PostgreSQL database in a Docker container with:
- Database name: `carcassonne`
- Username: `carcassonne`
- Password: `carcassonne`
- Port: `5432`

You can verify the container is running with:
```bash
docker ps
```

### Step 2: Start the Backend Server

```bash
# Navigate to the server directory
cd carcassonne-server

# Start the server
node server.js
```

The server will:
- Connect to the PostgreSQL database
- Run any pending migrations automatically
- Start listening on http://localhost:8080

### Step 3: Test the API

In a new terminal, you can test the API by creating a game:
```bash
curl -X POST http://localhost:8080/game/create
```

This should return a game ID like:
```json
{"gameId":"ABC123XYZ"}
```

### Step 4: Verify Database Storage

You can check that the game was stored in the database using the provided utility script:
```bash
./db-query.sh
```

This will show all games in the database.

### Step 5: Start the Frontend (Optional)

```bash
# Navigate to the frontend directory
cd carcassonne-frontend

# Install dependencies (if not already installed)
npm install

# Start the frontend application
npm start
```

The frontend will run on http://localhost:3000.

## Project Structure

- `carcassonne-frontend/` - React frontend application
- `carcassonne-server/` - Node.js backend server with Express
- `docker-compose.yml` - Docker Compose configuration for PostgreSQL
- `db-query.sh` - Utility script for querying the database

## Database Details

### Connection Information

- Host: `localhost`
- Port: `5432`
- Database: `carcassonne`
- Username: `carcassonne`
- Password: `carcassonne`

### Schema

The application uses a simple PostgreSQL schema:

**Games Table**
- `game_id` (string, primary key): Unique identifier for the game
- `game_state` (jsonb): JSON representation of the game state
- `status` (enum): Game status (waiting, active, finished)
- `created_at` (timestamp): When the game was created
- `updated_at` (timestamp): When the game was last updated

## Using pgAdmin to View the Database

You can use pgAdmin to view and manage your PostgreSQL database. Here are two options:

### Option 1: Run pgAdmin in Docker (Recommended)

1. **Update your docker-compose.yml file:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: carcassonne-postgres
    environment:
      POSTGRES_USER: carcassonne
      POSTGRES_PASSWORD: carcassonne
      POSTGRES_DB: carcassonne
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - carcassonne-network

  pgadmin:
    image: dpage/pgadmin4
    container_name: carcassonne-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - carcassonne-network

networks:
  carcassonne-network:
    driver: bridge

volumes:
  postgres_data:
```

2. **Restart Docker Compose:**

```bash
docker-compose down
docker-compose up -d
```

3. **Access pgAdmin:**
   - Open your browser and go to: http://localhost:5050
   - Login with:
     - Email: admin@admin.com
     - Password: admin

4. **Connect to PostgreSQL:**
   - Click "Add New Server"
   - General tab: Name = "Carcassonne"
   - Connection tab:
     - Host: postgres (use the service name, not localhost)
     - Port: 5432
     - Database: carcassonne
     - Username: carcassonne
     - Password: carcassonne

### Option 2: Install pgAdmin Locally

If you prefer to install pgAdmin on your local machine:

1. Download from [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/)
2. Install and launch (it opens in your web browser)
3. Connect using:
   - Host: localhost
   - Port: 5432
   - Database: carcassonne
   - Username: carcassonne
   - Password: carcassonne

## Troubleshooting

### Docker Issues

If you encounter issues with Docker:
```bash
# Check if the container is running
docker ps

# If not running, check for errors
docker ps -a

# Restart the container if needed
docker-compose down
docker-compose up -d
```

### Database Connection Issues

If the server can't connect to the database:
1. Ensure the PostgreSQL container is running
2. Check that the connection details in `.env` match the Docker configuration
3. Try connecting manually using the db-query.sh script

### Server Issues

If the server won't start:
1. Check for error messages in the console
2. Ensure all dependencies are installed
3. Verify that the PostgreSQL container is running