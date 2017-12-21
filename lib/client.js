'use strict';

const socketIOClient = require('socket.io-client');
const pathToRegexp = require('path-to-regexp');
const debug = require('debug-logger')('express-bridge/client');

class BridgeClient {
    constructor(url, options) {
        var self = this;

        // validate options
        options = options || {};
        self.config = options || {};
        self.config.server = options.server || {};
        self.config.server.url = url || 'http://127.0.0.1:3000';
        self.config.server.path = options.server.path || '';
        self.config.server.rejectUnauthorized = (typeof options.server.rejectUnauthorized == 'undefined') ? true : options.server.rejectUnauthorized;

        self.routes = [];
    }

    /**
     * Start and connect the client
     */
    start(cb) {
        var self = this;

        // init socket client
        self.io = socketIOClient(self.config.server.url, self.config.server);

        // add socket events
        self.addSocketEvents(cb);
    }

    /**
     * All socket event handler
     */
    addSocketEvents(cb) {
        var self = this;

        function fireCallback(err) {
            if (cb) {
                cb(err);
                cb = null;
            }
        }

        self.io
            .on('connect', () => {
                debug.log('connect');
                fireCallback();
            })
            .on('event', () => {
                debug.log('event');
            })
            .on('disconnect', () => {
                debug.log('disconnect');
            })
            .on('error', (err) => {
                debug.warn('err:', err);
                fireCallback(err);
            })
            .on('connect_error', (err) => {
                debug.warn('connect_error:', err);
                fireCallback(err);
            })
            .on('systemMessage', (data) => {
                debug.log('systemMessage:', data);
            })
            .on('requestMessage', function (req) {
                debug.log('incoming requestMessage:', JSON.stringify(req, null, 4));
                self.parseRequestMessage(req);
            });
    }

    /**
     * Parse a request message from server
     */
    parseRequestMessage(req) {
        var self = this;

        // url decode a string value
        function decodeParam(val) {
            if (typeof val !== 'string' || val.length === 0) { return val; }
            try {
                return decodeURIComponent(val);
            } catch (err) {
                if (err instanceof URIError) {
                    err.message = 'Failed to decode param \'' + val + '\'';
                    err.status = err.statusCode = 400;
                }
                throw err;
            }
        }

        // Get the params which found in URL path
        // Example: /path/:param + /path/test = { param: 'test' }
        function getParamsByMatch(keys, match) {
            var path = match[0];
            var params = {};
            for (var i = 1; i < match.length; i++) {
                var key = keys[i - 1];
                var prop = key.name;
                var val = decodeParam(match[i]);
                if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
                    params[prop] = val;
                }
            }
            return params;
        }

        var routeCount = 0;

        function nextRoute() {
            if (routeCount >= self.routes.length) {
                return;
            }
            var route = self.routes[++routeCount];

            // Search params in the URL path
            var foundKeys = [];
            var regexp = pathToRegexp(route.path, foundKeys);
            var matchParams = regexp.exec(req.path);

            // Set params to the request object
            if (matchParams) {
                req.params = getParamsByMatch(foundKeys, matchParams);
            }

            // Execute a route by hitting a static path or dynamic params path
            // Hit: /mypath or /mypath/:params
            if (req.path == route.path || matchParams || route.path == '') {
                var res = {
                    // method to send data back to the server
                    send: (body, headers, statusCode) => {
                        self.sendSocketClientToSocketServer(req.id, body, headers, statusCode);
                    }
                };

                // Execute the route
                route.callback(req, res, nextRoute);
                return;
            }
            nextRoute();
        }
        nextRoute();
    }

    /**
     * Send requests from http to the socket client
     */
    sendSocketClientToSocketServer(reqId, body, headers, statusCode) {
        var self = this;

        debug.log('sendSocketClientToSocketServer:', reqId);

        self.io.emit('responseMessage', {
            id: reqId,
            result: {
                statusCode: statusCode || 200,
                headers: headers || {},
                body: body
            }
        });
    }

    /**
     * add a route
     */
    route(path, cb) {
        if (typeof path == 'function') {
            cb = path;
            path = '';
        }
        this.routes.push({
            path: path,
            callback: cb
        });
    }
}

exports = module.exports = BridgeClient;
