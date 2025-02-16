import express from "express";
import vtuberRoutes from "./routes/vtuberRoutes";
import { connectToDatabase } from "./database/postgres";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config;
const app = express();
const ia = process.env.I_ACCESS || "";

app.use(express.json());
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      // "http://localhost:3000",
      "https://holo-elden.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);
app.use((req, res, next) => {
  const allowedOrigins = ["https://holo-elden.netlify.app"];
  const origin: string = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, ngrok-skip-browser-warning"
    );
    next();
  } else {
    res.status(403).json({ error: "Access denied" });
  }
});

app.use("/api", vtuberRoutes);

const PORT = process.env.PORT || 3000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
