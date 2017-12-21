'use strict';

const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const addRequestId = require('express-request-id')();
const debug = require('debug-logger')('express-bridge/server');

class BridgeServer {
    constructor(options) {
        var self = this;

        // validate options
        options = options || {};
        self.config = options || {};
        self.config.server = options.server || {};
        self.config.server.socket = options.server.socket || {};
        self.config.server.http = options.server.http || {};

        self.config.server.socket.path = options.server.socket.path || '';
        self.config.server.socket.pingInterval = options.server.socket.pingInterval || 10000;
        self.config.server.socket.pingTimeout = options.server.socket.pingTimeout || 5000;
        self.config.server.socket.cookie = options.server.socket.cookie || true;

        self.config.server.http.port = options.server.http.port || 3000;

        // init request cache for async response
        self.requestCache = {};

        // list of clients which are connected
        self.clients = [];

        // init app
        self.app = express();

        // init http express server
        self.http = http.createServer(self.app);

        // add http routings to handle incoming http requests
        self.addHttpMiddleware();
    }

    start(cb) {
        var self = this;
        var port = self.config.server.http.port;

        // init socket server
        self.io = socketIO(self.http, self.config.server.socket);

        // add socket events
        self.addSocketEvents();

        // error handling
        self.http.on('error', function (err) {
            cb(err);
        });
        
        // start http server
        self.http.listen(port, () => {
            console.log('express-bridge/server listening on *:' + port);
            cb();
        });
    }

    addHttpMiddleware() {
        var self = this;

        debug.log('add HTTP middleware');

        self.app.use(bodyParser.json()); // support json encoded bodies
        self.app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
        self.app.use(addRequestId);

        self.app.use((req, res, next) => {
            self.sendHttpRequestToSocketClient(req, res, next);
        });
    }

    addSocketEvents() {
        var self = this;

        self.io.on('error', (err) => {
            debug.warn('error:', err);

        });
        self.io.on('connection', (socket) => {
            debug.log('a client connected');

            // add user
            self.clients.push({
                id: socket.id
            });

            // send welcome message to client
            socket.emit('systemMessage', 'Welcome to the Express-Bridge server.');

            // perform this when the user disconnects
            socket.on('disconnect', () => {
                debug.log('disconnect client:', socket.id);

                // remove user from client list
                self.clients = self.clients.filter((client) => {
                    return client.id !== socket.id;
                });
            });

            // when the ser required a client list
            socket.on('responseMessage', (res) => {
                self.sendSocketResponseToHttpClient(res);
            });
        });
    }

    /**
     * Send client data back to the http client
     */
    sendSocketResponseToHttpClient(res) {
        var self = this;

        debug.log('sendSocketResponseToHttpClient:', res.id);

        if (self.requestCache[res.id] && res && res.result) {
            // find the right request in the cache
            var response = self.requestCache[res.id];

            if (!response) {

            }

            // add optional headers
            response.set(res.result.headers || {});

            // send result to the http client
            response
                // send status 200 by default
                .status(res.result.statusCode || 200)
                // send json or html
                .send(res.result.body);

            // delete request from cache
            delete self.requestCache[res.id];
        }
    }

    /**
     * Send requests from http to the socket client
     */
    sendHttpRequestToSocketClient(req, res, next) {
        var self = this;

        debug.log('sendHttpRequestToSocketClient:', req.id);

        self.io.sockets.emit('requestMessage', {
            id: req.id,
            method: req.method,
            path: req.path,
            headers: req.headers,
            params: {},
            query: req.query,
            body: req.body
        });

        // cache the request for async response
        self.requestCache[req.id] = res;
    }
}

exports = module.exports = BridgeServer;
