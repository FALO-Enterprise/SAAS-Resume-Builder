require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

(async () => {
  try {
<<<<<<< HEAD
    const templates = await prisma.template.findMany();
    console.log("DB TEMPLATES:", JSON.stringify(templates, null, 2));
=======
    const count = await prisma.user.count();
    console.log("user count", count);
    const account = await prisma.oAuthAccount.findFirst({
      where: { provider: "github" },
    });
    console.log("oauth account sample", account);
>>>>>>> 2d37f13c885a2bf769929a527a51cb932118d85b
  } catch (e) {
    console.error("error", e);
  } finally {
    await prisma.$disconnect();
  }
})();
