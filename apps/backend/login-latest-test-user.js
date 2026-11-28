require("dotenv/config");
const { Client } = require("pg");
const http = require("http");

async function getLatestTestUserEmail() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT "email" FROM "User" WHERE "email" LIKE 'test+%' ORDER BY "createdAt" DESC LIMIT 1`,
    );
    if (res.rowCount === 0) return null;
    return res.rows[0].email;
  } finally {
    await client.end();
  }
}

function requestLogin(email, password) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email, password });
    const req = http.request(
      "http://localhost:3001/api/auth/login-jwt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const email = await getLatestTestUserEmail();
    if (!email) {
      console.error("No test user found");
      process.exit(2);
    }
    console.log("Logging in as:", email);
    const res = await requestLogin(email, "Password123!");
    console.log("HTTP", res.status, res.body);
    if (res.status === 200) {
      const json = JSON.parse(res.body);
      const token =
        json.data?.token || json.token || (json.data && json.data.token);
      console.log("TOKEN:", token);
    }
  } catch (err) {
    console.error("ERR", err);
    process.exit(1);
  }
})();
