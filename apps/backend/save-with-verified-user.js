require("dotenv/config");
const { Client } = require("pg");
const http = require("http");

async function getLatestVerifiedTestUserEmail() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT "email" FROM "User" WHERE "email" LIKE 'test+%' AND "isVerified" = true ORDER BY "createdAt" DESC LIMIT 1`,
    );
    if (res.rowCount === 0) return null;
    return res.rows[0].email;
  } finally {
    await client.end();
  }
}

function request(path, method, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL("http://localhost:3001" + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { "Content-Type": "application/json", ...(headers || {}) },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: data, headers: res.headers }),
      );
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    const email = await getLatestVerifiedTestUserEmail();
    if (!email) {
      console.error("No verified test user found");
      process.exit(2);
    }
    console.log("Using verified email:", email);
    // login
    const login = await request("/api/auth/login-jwt", "POST", {
      email,
      password: "Password123!",
    });
    console.log("login", login.status, login.body);
    if (login.status !== 200) {
      console.error("Login failed");
      process.exit(1);
    }
    const json = JSON.parse(login.body);
    const token = json.data?.token || json.token;
    if (!token) {
      console.error("No token");
      process.exit(1);
    }

    const payload = {
      template: null,
      currentStep: "contact",
      completedSteps: ["contact"],
      sectionOrder: [
        "summary",
        "skills",
        "experience",
        "projects",
        "education",
        "certifications",
      ],
      contact: {
        fullName: "Verified Test",
        title: "Dev",
        email,
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: "",
      skillGroups: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      skills: [],
    };

    const save = await request("/api/dashboard", "PUT", payload, {
      Authorization: `Bearer ${token}`,
    });
    console.log("save", save.status, save.body);
  } catch (err) {
    console.error("ERR", err);
    process.exit(1);
  }
})();
