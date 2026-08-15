require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

(async () => {
  try {
    const templates = await prisma.template.findMany();
    console.log("DB TEMPLATES:", JSON.stringify(templates, null, 2));
  } catch (e) {
    console.error("error", e);
  } finally {
    await prisma.$disconnect();
  }
})();
