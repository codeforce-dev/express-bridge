'use strict';

const bridge = require('../lib/bridge');
const client = new bridge.Client('http://127.0.0.1:3000');

client.route('/', (req, res, next) => {
    console.log('client.route', req.path);

    // send response to the HTTP client
    res.send({
        version: '1.0',
        result: {
            message: 'Hello World'
        }
    });
});

client.route('/getGenderName/:gender', (req, res, next) => {
    console.log('client.route', req.path, 'params:', req.params);

    if (req.params.gender == 'male') {
        // send response to the HTTP client
        return res.send({ status: 'ok', name: 'John' });
    }
    if (req.params.gender == 'female') {
        // send response to the HTTP client
        return res.send({ status: 'ok', name: 'Kate' });
    }

    // send response to the HTTP client
    return res.send({ error: 'gender not found!' });
});

client.route((req, res, next) => {
     res.send({
        error: {
            code: 404,
            message: 'Unsupported request.'
        }
    }, null, 404);
});

client.start((err) => {
    if (!err) {
        console.log('client is running...');
    }
});
