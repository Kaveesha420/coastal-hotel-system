import { prisma } from "./lib/prisma.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import roomRoutes from "./routes/roomRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "20kb" }));

// API health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Coastline Retreat API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      message: "Database connection successful",
      database: "coastal_hotel_db",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

export default app;
