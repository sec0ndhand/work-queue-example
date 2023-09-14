const {requester, expect} = require('./setup.test.js');

describe('Server', () => {
    it('loads, as expected', function(done) { // <= Pass in done callback
        requester
            .get('/')
            .end((err, res) => {
                expect(res).to.have.status(404);
                done();                               // <= Call done to signal callback end
            });
    });

    it('/graphql', function(done) { // <= Pass in done callback
        const query = {
            query: `{
                User(id: "1") {
                    email
                }
            }`
        };

        requester
            .post('/graphql')
            .set('Content-Type', 'application/json')  // set content-type header
            .send(JSON.stringify(query)) // send JSON-encoded query string
            .end((err, res) => {
                if (err) {
                    console.log(err);
                    done(err);
                    return;
                }
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.data.User).to.equal(null);
                // Additional assertions to verify the GraphQL response.
                done(); // <= Call done to signal callback end
            });
    });
});

module.exports = { requester };
