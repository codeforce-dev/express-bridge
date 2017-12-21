# Express-Bridge for node.js

API data exchange between an public webserver and a local network without dynDNS.

```
Browser <--> Public Webserver (btw. Cloud) <-- Express-Bridge --> Local Network (btw. Raspberry Server) --> Smart Home Device
```

Express-Bridge allows data to be sent to a server on a local network without having to open the network to the outside. The bridge can be used to forward API calls from the web server to smart home devices in your private local network.

For example: Amazon Alexa makes an API call to your webserver with a "turn light on" command. Your webserver sends this request over the express-bridge to a local server (btw. respberry) in your home. After the server turns the light on, then send a response other the bridge back to alexa.

Please look at the example folder for more informations.
