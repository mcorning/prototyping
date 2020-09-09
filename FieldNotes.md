# Field Notes

Incorporate these field notes into ReadMe.md

## Debugging

1. Start the **socket.io.server** project with F5
2. In the soteria lct project
   1. Set the `socketUrl` to "http://localhost:3003"
   2. or open `main.js` and set the `local` variable to `true`
   3. Choose the `serve` script in NPM SCRIPTS Explorer
   4. Open the `localhost` or `IP` url for the client

## Production

1. On the VM command line enter: `git pull`
2. Start socket.io server with `node .` command line entry
3. Note ngrok server has good connections
4. Make sure the LCT config file `socketUrl` variable points to the **ngrok server URL**
5. Make sure the last good build of the client is uploaded to the **Azure Static Website**
6. Start the clients from the **Azure URL**

## Setup

1. Deploy an Ubuntu VM on Azure
2. Create a user/password
3. Install RDP
4. Login through RDP using user/password
5. Clone lct repository
6. Go to repo directory
7. Install ngrok
8. On command line enter: ./ngrok http 3003
9. on command line enter: node .
