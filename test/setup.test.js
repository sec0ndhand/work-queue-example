const chai = require("chai");
const chaiHttp = require('chai-http');
const { app } = require('../index.js');
const { expect } = chai;

chai.use(chaiHttp);

const requester = chai.request(app).keepOpen();

before(function(done) {
    done();
});

after(function(done) {
// close the database
    requester.close();
    done();
});

exports.requester = requester
exports.expect = expect
