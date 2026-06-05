// Re-export the single shared Prisma instance so the whole app uses one
// connection pool. Kept for backwards-compatibility with `@/lib/db` imports.
import { prisma } from "@/lib/prisma";

export { prisma };
export default prisma;
