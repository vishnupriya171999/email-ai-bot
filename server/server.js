const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { connectDatabase } = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const { authMiddleware } = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [clientOrigin, "http://localhost:3000"],
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "email-ai-bot-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/emails", authMiddleware, emailRoutes);

app.use(errorHandler);

async function startServer() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});

