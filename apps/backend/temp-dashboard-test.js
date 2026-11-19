const http = require("http");
const { URL } = require("url");

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
      res.on("data", (chunk) => {
        data += chunk;
      });
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
    const email = `test+${Date.now()}@example.com`;
    const reg = await request("/api/auth/register", "POST", {
      name: "Test User",
      email,
      password: "Password123!",
      locale: "en",
    });
    console.log("register", reg.status, reg.body);

    const login = await request("/api/auth/login-jwt", "POST", {
      email,
      password: "Password123!",
    });
    console.log("login", login.status, login.body);

    const loginData = JSON.parse(login.body);
    const token = loginData?.data?.token;
    if (!token) {
      console.error("No token returned");
      return;
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
        fullName: "Test User",
        title: "Developer",
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
  } catch (error) {
    console.error("ERR", error);
  }
})();
