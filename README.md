# Express-Bridge for node.js

Make API calls between a public webserver and a local network without dynDNS.

```
Browser <-> Webserver (btw. Cloud) <- Express-Bridge -> Local Network (btw. Raspberry Server) -> Smart Home Device
```

Express-Bridge allows data to be sent to a server on a local network without having to open the network to the outside. The bridge can be used to forward API calls from the web server to smart home devices in your private local network.

For example: Amazon Alexa makes an API call to your webserver with a "turn light on" command. Your webserver sends this request over the express-bridge to a local server (btw. respberry) in your home. After the server turns the light on, then send a response over the bridge back to alexa.

## Examples

### Server (public Webserver)
```
const bridge = require('../lib/bridge');
const server = new bridge.Server(server: {http: {port: 80}});

server.start((err) => {});
```

### Client (local Raspberry)
```
const client = new bridge.Client('http://<webserver-domain>:80');

client.route('/', (req, res, next) => {
    console.log('Incoming data:', req);
    res.send({ status: 'ok' });
});

client.start((err) => {});
```

### How to work

1. Starting the Webserver
```
$ DEBUG=express-bridge/* node  examples/server-bridge.js
```

2. Starting the local Server
```
$ DEBUG=express-bridge/* node  examples/local-client.js
```

3. Make a browser request
```
http://127.0.0.1:3000
```

### Incoming Data Format
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
    params: {},
    query: {},
    body: {}
}
```
