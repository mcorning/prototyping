# Field Notes

Incorporate these field notes into ReadMe.md

## Known Issues

1. Enter confirmation dialog appears when the Room dropdown is empty.
2. Warning dialog has extraneous dates
3. Firefox doesn't connect with a refresh because:

 ```XHRPOSThttp://localhost:3003/socket.io/?EIO=3&transport=polling&t=NOVq5g6&sid=-BXeQNWLjLl9t-tpAAAB
[HTTP/1.1 400 Bad Request 1ms]

POST
  http://localhost:3003/socket.io/?EIO=3&transport=polling&t=NOVq5g6&sid=-BXeQNWLjLl9t-tpAAAB
Status 400   
  Bad Request

VersionHTTP/1.1
Transferred282 B (41 B size)
    Access-Control-Allow-Credentials
      true
    Access-Control-Allow-Origin
      http://localhost:8080
    Connection
      keep-alive
    Content-Type
      application/json
    Date
      Tue, 01 Dec 2020 19:38:37 GMT
    Transfer-Encoding
      chunked

    Accept
      */*
    Accept-Encoding
      gzip, deflate
    Accept-Language
      en-US,en;q=0.5
    Connection
      keep-alive
    Content-Length
      30
    Content-type
      text/plain;charset=UTF-8
    Cookie
      io=-BXeQNWLjLl9t-tpAAAB
    Host
      localhost:3003
    Origin
      http://localhost:8080
    Referer
      http://localhost:8080/visitor
    User-Agent
      Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0```

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

## Transductions

The basic LCT object is the message. The basic LCT data structure is an array of messages:

```json

  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-19T00:33:04.248Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-14T02:53:33.738Z',
  },
  {
    visitor: 'Nurse Jackie',
    room: 'Heathlands.Medical',
    message: 'Entered',
    sentTime: '2020-09-18T07:15:00.00Z',
  },
```
The basic transduction groups `sentTime` values by `room` for each `visitor`. These named arrays are provide value(s) the `warnings` field of the `message` parameter used by the server's `exposureWarning` event handler. For example, Nurse Jackie's three visits to Heathlands.Medical look like this `warning`: 

```json
  Heathlands.Medical:[
    '2020-09-19T00:33:04.248Z', '2020-09-14T02:53:33.738Z', '2020-09-18T07:15:00.00Z'
  ]
```
The exposureWarning event handler also needs additional data.

```json
{
    sentTime:'2020-09-19T00:56:54.570Z',  // dateTime of the warning
    visitor:'Nurse Jackie',               // Visitor name
    warnings:{                            // dates Visitor visited Room
      Heathlands.Medical:[                // Room name
         '2020-09-19T00:33:04.248Z', '2020-09-14T02:53:33.738Z', '2020-09-18T07:15:00.00Z'
      ]                                   // server alerts other Room Visitors on these dates
    }
 };
 ```

