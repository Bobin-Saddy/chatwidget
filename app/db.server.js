import { PrismaClient } from "@prisma/client";

let db;

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
  db = global.prismaGlobal;
}

export { db };
