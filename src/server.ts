import express, { Request, Response, NextFunction } from "express";
import { CreateTestBookDTO, DatabaseError } from "./types";
import {
  createConnection,
  getAllBooks,
  getBookById,
  createBook,
  closeConnection,
} from "./database";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
const port = process.env.PORT || 3000;

let db: sqlite3.Database;

// Error handling middleware
const errorHandler = (
  err: DatabaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : err.message,
  });
};

async function initializeApp() {
  try {
    // Initialize database connection
    db = await createConnection("books.db");
    console.log("Database initialized successfully");

    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.use(express.json());

    // GET all books
    app.get(
      "/books",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const books = await getAllBooks(db);
          res.json(books);
        } catch (err) {
          next(err);
        }
      }
    );

    // GET book by id
    app.get(
      "/books/:id",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const id = parseInt(req.params.id);

          if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID format" });
            return;
          }

          const book = await getBookById(db, id);

          if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
          }

          res.json(book);
        } catch (err) {
          next(err);
        }
      }
    );

    // POST new book
    app.post(
      "/books",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const bookData: CreateTestBookDTO = req.body;

          // Validation
          const validationErrors: string[] = [];

          if (!bookData.title?.trim())
            validationErrors.push("Title is required");
          if (!bookData.author?.trim())
            validationErrors.push("Author is required");
          if (!bookData.year || isNaN(bookData.year))
            validationErrors.push("Valid year is required");

          if (validationErrors.length > 0) {
            res.status(400).json({ errors: validationErrors });
            return;
          }

          const id = await createBook(db, {
            title: bookData.title.trim(),
            author: bookData.author.trim(),
            year: Number(bookData.year),
          });

          res.status(201).json({ id });
        } catch (err) {
          next(err);
        }
      }
    );

    // Error 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Not found" });
    });

    // Error handler
    app.use(errorHandler);

    // Start server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  }
}

//  shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Starting shutdown...");

  try {
    await closeConnection(db);
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Initialize the application
initializeApp().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
