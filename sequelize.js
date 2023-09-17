const env = process.env.NODE_ENV || "development";
const { getModels } = require("sigue");

// Set up the database
const db = getModels({
    db_url: process.env.DATABASE_URL || require("./config/config")[env]?.url,
    config: require("./config/config")[env],
    modelsDirectory: __dirname + "/models",
  });

exports.db = db;
