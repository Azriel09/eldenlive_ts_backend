import express from "express";
import vtuberRoutes from "./routes/vtuberRoutes";
import { connectToDatabase } from "./database/postgres";
import dotenv from "dotenv";
dotenv.config;
const app = express();
const ia = process.env.I_ACCESS || "";

app.use(express.json());

app.use((req, res, next) => {
    const allowedOrigins = ["https://holo-elden.netlify.app"]; // Replace with your Netlify app URL
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
      res.status(403).json({ error: "Access denied" }); // Block requests from unauthorized origins
    }
  });


// Routes
app.use("/api", vtuberRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
