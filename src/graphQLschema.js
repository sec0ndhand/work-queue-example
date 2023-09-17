const {
  graphql: { GraphQLString },
} = require("sigue");
const {db} = require('../sequelize');

const {pullFromQueue, removeFromQueue} = require('./redis-queue');
const queue = 'reservations';

const query = {
  getNext: {
    type: GraphQLString,
    async resolve() {
      const id = await pullFromQueue({queue});
      return id;
    },
  },
};

const mutation = {
  complete: {
    type: GraphQLString,
    args: {
      id: {
        type: GraphQLString,
      },
    },
    async resolve(parent, args, contextValue, info) {
      const id = args.id;
      console.log('complete', id);
      await removeFromQueue({id, queue});
      await db.sequelize.models.Reservation.destroy({where: {id}});
      return id;
    },
  },
};

exports.query = query;
exports.mutation = mutation;
