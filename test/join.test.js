const chai = require("chai");
const path = require("path");
const expect = chai.expect;
const { schema: schemaGenerator, getModels } = require("sigue");
const env = process.env.NODE_ENV || "test";

describe("Chai & Mocha Setup", () => {
  it("should assert correctly", () => {
    const one = 1;
    expect(one).to.equal(1);
  });
});

describe("Sequelize", () => {
  // add a before all hook to create the database, and clear it
  var db = undefined;
  beforeEach(function (done) {
    db = getModels({
      db_url: process.env.DATABASE_URL || require("../config/config")[env]?.url,
      config: require("../config/config")[env],
      modelsDirectory: path.resolve("./models"),
    });

    db.sequelize.sync({ force: true }).then(() => {
      done();
    });
  });

  it("should be set up", () => {
    const defined = !!db;
    expect(defined).to.equal(true);
  });

  it("should have a user model", () => {
    const User = db.User;
    expect(User).to.not.equal(undefined);
  });

  it("should be able to create a User linked to a preference", async () => {
      await db.User.create({
        name: "test user",
        email: "test@test.com",
      });

      const tmpUserArray = await db.User.findAll({
        limit: 1,
      });
      const tmpUser = tmpUserArray[0];

      expect(tmpUserArray).to.not.equal(undefined);
      expect(tmpUserArray.length).to.equal(1);
      expect(tmpUser.name).to.equal("test user");

      await db.Preference.create({
        user_id: tmpUser.id,
        type: "test",
      });


      const tmpPrefArray = await db.Preference.findAll({
        limit: 1,
      });
      const tmpPref = tmpPrefArray[0];

      expect(tmpPrefArray).to.not.equal(undefined);
      expect(tmpPrefArray.length).to.equal(1);
      expect(tmpPref.user_id).to.equal(tmpUser.id);

      const userWithPref = await db.User.findOne({
        where: {
          id: tmpUser.id,
        },
        include: { model: db.Preference, as: 'preferences' },
      });

      expect(userWithPref).to.not.equal(undefined);
      expect(userWithPref.name).to.equal("test user");
      expect(userWithPref.preferences).to.not.equal(undefined);
      expect(userWithPref.preferences.length).to.equal(1);
      expect(userWithPref.preferences[0].type).to.equal("test");
  });
});
