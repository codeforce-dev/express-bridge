# Express-Bridge for node.js

Make API calls between a public webserver and a local network without DynDNS.

```
Browser <-> Webserver (Cloud) <- Express-Bridge -> Local Network (btw. Raspberry) -> Smart Home Device
```

Express-Bridge sends data to a server on a local network without having to open the network to the outside. The bridge can be used to forward API calls from the web server to smart home devices in your private local network.

For example: Amazon Alexa makes an API call to your webserver with a "turn light on" command. Your webserver sends this request over the express-bridge to a local server (btw. respberry) in your home. After the server turns the light on, then send a response over the bridge back to alexa.

## Examples

### Server (public webserver)
```
const bridge = require('express-bridge');
const server = new bridge.Server(server: {http: {port: 80}});

server.start((err) => {});
```

### Client (local raspberry)
```
const bridge = require('express-bridge');
const client = new bridge.Client('http://<webserver-domain>:80');

client.route('/light/:lightId/turn/:action', (req, res, next) => {
    console.log('Incoming data:', req);
    res.send({ status: 'ok' });
});

client.start((err) => {});
```

### How does it work

1. Starting the webserver
```
$ DEBUG=express-bridge/* node  examples/server-bridge.js
```

2. Starting the local server
```
$ DEBUG=express-bridge/* node  examples/local-client.js
```

3. Make a browser request to the webserver
```
http://<webserver-domain>/light/livingroom/turn/on
```

### Incoming message format
```
{
    id: 'a86ba5b6-3f25-4fb8-a5ac-3f60d06b26fe',
    method: 'GET',
    headers: {
        'cache-control': 'no-cache',
        'user-agent': 'PostmanRuntime/6.4.1',
        'accept': '*/*',
        'host': '127.0.0.1:3000',
        'accept-encoding': 'gzip, deflate',
        'content-length': '170',
        'connection': 'keep-alive'
    },
    params: {
        lightId: 'livingroom',
        action: 'on'
    },
    query: {},
    body: {}
}
```
