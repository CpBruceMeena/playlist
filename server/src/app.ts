import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/security.js";
import { logger } from "./utils/logger.js";

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(securityHeaders);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes will be registered here in subsequent phases
// import { generateRouter } from "./routes/generate.routes.js";
// app.use("/api/v1/generate", generateRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
