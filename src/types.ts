export interface TestBook {
  id: number;
  title: string;
  author: string;
  year: number;
}

export interface CreateTestBookDTO {
  title: string;
  author: string;
  year: number;
}

export interface DatabaseError extends Error {
    code?: string
}

