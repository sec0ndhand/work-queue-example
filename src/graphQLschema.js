const {
  graphql: { GraphQLString },
} = require("sigue");

const query = {
  hello: {
    type: GraphQLString,
    resolve() {
      return "world";
    },
  },
};

const mutation = {
  goodbye: {
    type: GraphQLString,
    resolve() {
      return "world";
    },
  },
};

exports.query = query;
exports.mutation = mutation;
