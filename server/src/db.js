// server/src/db.js - Prisma client singleton
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
