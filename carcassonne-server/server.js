const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));

// Routes
const gameRoutes = require("./routes/gameRoutes");
app.use("/game", gameRoutes);

// Database connection and migrations
async function setupDatabase() {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log("Database migrations completed successfully");
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

// Initialize the application
setupDatabase();
