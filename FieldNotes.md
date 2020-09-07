# Field Notes

Incorporate these field notes into ReadMe.md

## Debugging

1. Start the **socket.io.server** project with F5
2. Set the `socketUrl` to "http://localhost:3003"
3. Open the `localhost` or `IP` url for the client

## Production

1.  Make sure the VM has the last good build from Developer machine
2.  Start socket.io server with `node .` command line entry
3.  Note ngrok server has good connections
4.  Make sure the LCT config file `socketUrl` variable points to the **ngrok server URL**
5.  Make sure the last good build of the client is uploaded to the **Azure Static Website**
6.  Start the clients from the **Azure URL**
