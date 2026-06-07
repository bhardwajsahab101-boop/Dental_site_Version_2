const http = require("http");

function testLogin(email, password) {
  const data = JSON.stringify({ email, password });

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/admin/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  console.log(`Sending login request for ${email}...`);

  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode}`);
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      console.log(`Response headers:`, res.headers);
      console.log(`Response body:`, body);
    });
  });

  req.on("error", (error) => {
    console.error(`Request error:`, error.message);
  });

  req.write(data);
  req.end();
}

testLogin("superadmin@example.com", "Superadmin123");
