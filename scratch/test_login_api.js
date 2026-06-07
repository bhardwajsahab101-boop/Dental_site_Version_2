const http = require("http");

function testLogin(host) {
  const data = JSON.stringify({
    email: "aksharma@gmail.com",
    password: "password123"
  });

  const options = {
    hostname: host,
    port: 3000,
    path: "/api/admin/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length
    }
  };

  console.log(`Sending request to http://${host}:3000/api/admin/login...`);

  const req = http.request(options, (res) => {
    console.log(`Response status for ${host}: ${res.statusCode}`);
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      console.log(`Response body for ${host}:`, body);
    });
  });

  req.on("error", (error) => {
    console.error(`Request error for ${host}:`, error.message);
  });

  req.write(data);
  req.end();
}

testLogin("localhost");
setTimeout(() => testLogin("ak-sharma.lvh.me"), 2000);
