import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const count = await prisma.user.count();
  console.log("user count", count);
  const account = await prisma.oAuthAccount.findFirst({
    where: { provider: "github" },
  });
  console.log("oauth account sample", account);
} catch (e) {
  console.error("error", e);
} finally {
  await prisma.$disconnect();
}
