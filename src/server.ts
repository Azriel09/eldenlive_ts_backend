import express, { Request, Response, NextFunction } from "express";
import {  CreateTestBookDTO, DatabaseError } from "./types";
import {
  createConnection,
  getAllBooks,
  getBookById,
  createBook,
  closeConnection,
} from "./database";

const app = express();
const port = 3000;
const db = createConnection("books.db");

app.use(express.json());

const errorHandler = (
  err: DatabaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
};

app.get("/books", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await getAllBooks(db);
    res.json(books);
  } catch (err) {
    next(err);
  }
});

// GET book by id
app.get(
  "/books/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
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
app.post("/books", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookData: CreateTestBookDTO = req.body;

    // Basic validation
    if (!bookData.title || !bookData.author || !bookData.year) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const id = await createBook(db, bookData);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing database connection...");
  await closeConnection(db);
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
