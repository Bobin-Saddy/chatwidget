import { PrismaClient } from "@prisma/client";

let db;

if (process.env.NODE_ENV !== "production") {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
} else {
  db = new PrismaClient();
}

export { db };
