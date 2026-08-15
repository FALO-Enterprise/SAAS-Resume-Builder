require("dotenv/config");
const { Client } = require("pg");

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set in environment");
    process.exit(2);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const res = await client.query(
      `SELECT "email", "id", "createdAt" FROM "User" WHERE "email" LIKE 'test+%' ORDER BY "createdAt" DESC LIMIT 1`,
    );

    if (res.rowCount === 0) {
      console.log("No test+ user found");
      return;
    }

    const user = res.rows[0];
    console.log("Found test user:", user.email, user.id, user.createdAt);

    const upd = await client.query(
      `UPDATE "User" SET "isVerified" = true WHERE "id" = $1 RETURNING "email", "isVerified"`,
      [user.id],
    );

    console.log("Updated:", upd.rows[0]);
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
