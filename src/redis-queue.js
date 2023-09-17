const Redis = require('ioredis');
const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Handle Redis connection errors
client.on('error', (err) => {
    console.log('Error:', err);
});

async function addToQueue({ id, queue = 'queue', timestamp = Date.now() }) {
    try {
        await client.zadd(queue, timestamp, id);
        return true;
    } catch (err) {
        console.error('Error adding to queue:', err);
        return false;
    }
}

async function pullFromQueue({
    queue = 'queue',
    isTaskComplete = isTaskCompleteDefault,
    ttl = (2 * 60 * 1000),
    delayed_queue = `delayed_${queue}`,
    processDelayed = true
}) {
    try {
        if (processDelayed) {
            await processDelayedQueue({ delayed_queue, queue });
        }
    } catch (err) {
        console.error('Error processing delayed queue:', err);
    }

    try {
        const items = await client.zrange(queue, 0, 0);
        if (!items || items.length === 0) {
            return null;
        }

        const id = items[0];
        if (isTaskComplete(id)) {
            await client.zrem(queue, id);
            return id;
        }

        const futureTimestamp = Date.now() + ttl;
        await client.zadd(delayed_queue, futureTimestamp, id);
        await client.zrem(queue, id);

        return id;
    } catch (err) {
        console.error('Error pulling from queue:', err);
        return null;
    }
}

async function processDelayedQueue({ queue = 'queue', delayed_queue = `delayed_${queue}` }) {
    try {
        const currentTime = Date.now();

        const items = await client.zrangebyscore(delayed_queue, 0, currentTime);

        for (let id of items) {
            await addToQueue({ id, queue });
            await client.zrem(delayed_queue, id);
        }
        return true
    } catch (err) {
        console.error('Error processing delayed queue:', err);
        return false;
    }
}

async function viewQueueItems({ queue = 'queue' }) {
    try {
        return await client.zrange(queue, 0, -1);
    } catch (err) {
        console.error('Error viewing queue items:', err);
        return null;
    }
}

async function removeFromQueue({ id, queue = 'queue', delayed_queue = `delayed_${queue}` }) {
    try {
        await client.zrem(queue, id);
    } catch (err) {
        console.error('Error removing from queue:', err);
    }

    try {
        await client.zrem(delayed_queue, id);
        return true;
    } catch (err) {
        console.error('Error removing from queue:', err);
        return false;
    }
}

async function removeFromDelayedQueue({ id, delayed_queue = 'delayed_queue' }) {
    try {
        await client.zrem(delayed_queue, id);
        return true;
    } catch (err) {
        console.error('Error removing from delayed queue:', err);
        return false;
    }
}

// Dummy function to determine if a task is complete. Replace with your logic.
function isTaskCompleteDefault(id) {
    // TODO: Implement your own logic to check if a task is complete.
    return false;
}

module.exports = {
    addToQueue,
    pullFromQueue,
    viewQueueItems,
    removeFromQueue,
    processDelayedQueue,
    removeFromDelayedQueue
};
