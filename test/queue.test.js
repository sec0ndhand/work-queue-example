const {requester, expect} = require('./setup.test.js');
const {addToQueue, pullFromQueue, removeFromQueue, viewQueueItems, processDelayedQueue} = require('../src/redis-queue.js');
const Redis = require('ioredis');
const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const queueDefault = 'test_queue_reserverations';
const Day = 1000 * 60 * 60 * 24 ;

describe('Redis Work Queue', () => {
    describe('When you create an item in the queue (redis sorted set)', () => {
        const queue = `${queueDefault}_1`;
        it('should be in the queue', function(done) { // <= Pass in done callback
            addToQueue({id: 5, queue})
            .then(passed => {
                expect(passed).to.equal(true);
                viewQueueItems({queue}).then(items => {
                    expect(items.length).to.equal(1);
                    removeFromQueue({id: 5, queue}).then(passed => {
                        expect(passed).to.equal(true);
                        viewQueueItems({queue}).then(items => {
                            expect(items.length).to.equal(0);
                            done();
                        })
                        .catch(err => { throw err; });
                    })
                    .catch(err => { throw err; });
                })
                .catch(err => { throw err; });
            })
            .catch(err => { throw err; })
        });
    });

    describe('When you add an item, pull from the queue, process them and remove the item from the delayed queue', () => {
        const queue = `${queueDefault}_2`;
        it('it should return to the queue when the time is more than 2 minutes.', function(done) { // <= Pass in done callback
            let t = 1;
            const id = 23;
            addToQueue({id, queue, timestamp: (new Date()).getTime() - (Day * 2), })
            .then(passed => {
                expect(passed).to.equal(true);
                viewQueueItems({queue}).then(items => {
                    expect(items.length).to.equal(1);
                    pullFromQueue({queue, processDelayed: false, ttl:  - (Day * 2)}).then(item => {
                        expect(item).to.equal(String(id));

                        // One item should be in the delayed queue
                        viewQueueItems({queue: `delayed_${queue}`}).then(items => {
                            expect(items.length).to.equal(1);
                            processDelayedQueue({queue}).then(processed => {
                                expect(processed).to.equal(true);

                                // No items should be in the delayed queue
                                viewQueueItems({queue: `delayed_${queue}`}).then(items => {
                                    expect(items.length).to.equal(0);
                                    removeFromQueue({id, queue}).then(passed => {
                                        expect(passed).to.equal(true);

                                        // No items should be in the queue
                                        viewQueueItems({queue}).then(items => {
                                            expect(items.length).to.equal(0);
                                            done();
                                        })
                                        .catch(err => { throw err; });
                                    })
                                })
                                .catch(err => { throw err; });
                            })
                            .catch(err => { throw err; });
                        })
                        .catch(err => { throw err; });
                    })
                    .catch(err => { throw err; });
                })
                .catch(err => { throw err; });
            })
            .catch(err => { throw err; })
        });
    });

    describe('When you run create a reservation', () => {
        it('it should be in the database', function(done) { // <= Pass in done callback
            const query = {
                query: `mutation CreateReservation($groupSize: Int, $phone: String, $dateTime: Date) {
                  CreateReservation(group_size: $groupSize, phone: $phone, date_time: $dateTime) {
                    id
                    group_size
                    phone
                    date_time
                    arrival_time
                    createdAt
                    updatedAt
                    user_id
                    _deleted_
                  }
                }`,
                variables: {
                  groupSize: 4,
                  phone: '555-555-5555',
                  dateTime: '2020-01-01T00:00:00.000Z',
                }
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
                    expect(res.body.data.CreateReservation).to.be.an('object');

                    // One item should be in the queue
                    viewQueueItems({queue: "reservations"}).then(items => {
                        expect(items.length).to.equal(1);
                        done();
                    })
                });
        });
    });

    describe('When you pull an item', () => {
        it('it should move the item to the delayed queue', function(done) { // <= Pass in done callback
            const query = {
                query: `query RootQueryType {
                    getNext
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
                    expect(res.body.data.getNext).to.be.a('string');


                    // One item should be in the queue
                    viewQueueItems({queue: "delayed_reservations"}).then(items => {
                        expect(items.length).to.equal(1);
                        done();
                    })
                    .catch(err => { throw err; });
                });
        });
    });

    describe('When you complete an item', () => {
        it('it should be gone from all the queues', function(done) { // <= Pass in done callback
            const query = {
                query: `mutation RootMutationType {
                    complete(id: "1")
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
                    expect(res.body.data.complete).to.be.a('string');


                    // 0 items should be in the queue
                    viewQueueItems({queue: "delayed_reservations"}).then(items => {
                        expect(items.length).to.equal(0);
                        // 0 items should be in the queue
                        viewQueueItems({queue: "reservations"}).then(items => {
                            expect(items.length).to.equal(0);
                            done();
                        })
                    })
                    .catch(err => { throw err; });
                });
        });
    });
});


module.exports = { requester };
