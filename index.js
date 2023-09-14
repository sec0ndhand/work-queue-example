const { schema: schemaGenerator, getModels } = require("sigue");
const env = process.env.NODE_ENV || "development";
const { createServer, startServer } = require("./src/server.js");
const { query, mutation } = require("./src/graphQLschema.js");
const { pubsub } = require("./src/redis-subscriptions.js");

// Set up the database
const db = getModels({
  db_url: process.env.DATABASE_URL || require("./config/config")[env]?.url,
  config: require("./config/config")[env],
  modelsDirectory: __dirname + "/models",
});

// Sync the database tables
db.sequelize.sync().then(() => {
  if (process.env.NODE_ENV !== "test") console.log("Database is ready");
});

// generate a schema, based on the sequelize models
var schema = schemaGenerator({
  models: db.sequelize.models,
  options: {
    pubsub,
    authenticated: (resolver) => async (parent, args, context, info) => {
      return resolver(parent, args, context, info);
    },
  },
  query,
  mutation,
});

// create the app
const app = createServer({ schema });

// start the server
if (process.env.NODE_ENV !== "test") startServer({ app, schema });

exports.app = app;
exports.db = db;
exports.schema = schema;
