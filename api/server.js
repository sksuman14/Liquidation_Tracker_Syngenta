const serverless = require("serverless-http");
const app = require("../server/server.js");

// Wrap Express so Vercel can run it
module.exports = serverless(app);
