# Field Notes

Incorporate these field notes into ReadMe.md

## Known Issues

1. Enter confirmation dialog appears when the Room dropdown is empty.

## Local Debugging

1. Start the **socket.io.server** project with F5
2. In the soteria lct project
   1. Open `main.js` and set the `local` variable to `true`
   2. Choose the `serve` script in NPM SCRIPTS Explorer
   3. Start debugger with F5 (select the "Launch PWA against localhost" configuration)

## Production

1. On the VM command line enter: `git pull`
2. Start socket.io server with `node .` command line entry
3. Note ngrok server has good connections
4. Enusre client app
   1. Does `main.js` show `local` = `false`?
   2. Make sure the LCT config file `socketUrl` variable points to the **ngrok server URL**
   3. Make sure the last good build of the client is uploaded to the **Azure Static Website**
   4. Start the clients from the **Azure URL**

## Setup

1. Deploy an Ubuntu VM on Azure
2. Create a user/password
3. Install RDP
4. Login through RDP using user/password
5. Clone lct repository
6. Go to repo directory
7. Install ngrok
8. On command line enter: `./ngrok http 3003`
9. on command line enter: `node .`

## Testing

Rooms can have the following state thread (in this order):

1. Online
   - connected to socket.io server
   - socket.id is unguessable
   - _Open Room_ button active in Room.vue
2. Available
   - connected to socket.io server
   - socket.id = Room ID
   - open for business
   - _Close Room_ button active in Room.vue
   - socket has length property = 1
3. Occupied (open for business, and hosting at least one Visitor)
   - socket.id is RoomId
   - at least one Visitor
   - socket has length property > 1
