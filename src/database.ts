import sqlite3 from "sqlite3";
import { TestBook, CreateTestBookDTO} from "./types";
export const createConnection = (dbPath: string): sqlite3.Database => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database", err);
      } else {
        console.log("Connected to SQLite Database");
        initializeDatabase(db);
      }
    });
    return db;
  };
const initializeDatabase = (db: sqlite3.Database): void => {
  db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER
      )
    `);

  const sampleBooks: [string, string, number][] = [
    ["The Great Gatsby", "F. Scott Fitzgerald", 1925],
    ["1984", "George Orwell", 1949],
    ["To Kill a Mockingbird", "Harper Lee", 1960],
  ];

  sampleBooks.forEach((book) => {
    db.run(
      "INSERT OR IGNORE INTO books (title, author, year) VALUES (?, ?, ?)",
      book
    );
  });
};



export const getAllBooks = (db: sqlite3.Database): Promise<TestBook[]> => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM books", [], (err, rows: TestBook[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getBookById = (
  db: sqlite3.Database,
  id: number
): Promise<TestBook | undefined> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM books WHERE id = ?", [id], (err, row: TestBook) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};
export const createBook = (
  db: sqlite3.Database,
  book: CreateTestBookDTO
): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO books (title, author, year) VALUES (?, ?, ?)",
      [book.title, book.author, book.year],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

export const closeConnection = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
