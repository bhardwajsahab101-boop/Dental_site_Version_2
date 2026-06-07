const http = require("http");

function testLogin(host, email, password) {
  const data = JSON.stringify({ email, password });

  const options = {
    hostname: host,
    port: 3000,
    path: "/api/admin/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      "Host": `${host}:3000` // Ensure Next.js gets the correct host header
    }
  };

  console.log(`Sending login request to http://${host}:3000/api/admin/login...`);

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

testLogin("ak-sharma.lvh.me", "aksharma@gmail.com", "Password123");
