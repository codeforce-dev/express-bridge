'use strict';

const bridge = require('../lib/bridge');
const server = new bridge.Server({
    server: {
        http: {
            port: 3000
        }
    }
});

server.start((err) => {
    if (!err) {
        console.log('server is running...');
    }
});
