'use strict';
const { addToQueue } = require('../src/redis-queue.js')

const {
  sequelize: { Model },
} = require("sigue");
module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Add association to User model
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Reservation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_size: DataTypes.INTEGER,
    phone: DataTypes.STRING,
    date_time: DataTypes.DATE,
    arrival_time: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Reservation',
    hooks: {
      afterSave: async (reservation, options) => {
        await addToQueue({id: reservation.id, queue: 'reservations'});
      }
    }
  });
  return Reservation;
};
