const controller = require("./controller.js")


exports.router = function (app) {
  app.get("/mapDetail/:id", controller.crawling); // read
};
