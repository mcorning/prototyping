# Local Contact Tracing Volunteers

All COVID-19 is local. This is why we call our strategy to fight the virus as Local Contact Tracing.

This means that communities who adopt LCT will have their own version of the infrastructure. They will, therefore, need their own developer to extend the base code.

Here are the technologies we use:

## Client

- _VueJS_ provides the user interface and local data management using _IndexedDB_
- Our data model uses _Vuex-ORM-localforage_
- Clients send and receive web socket messages with _Socket.io-client_ (implemented with _vue-socket.io_)

## Server

The _Socket.io_ Server is on an Azure Ubuntu VM running `node` v12.18.3 and `nodemon` v2.0.4.

For now, the prototype uses ngrok to provide the https:// URL

## Volunteers

To join the cause, email [michael@secours.io](mailto://michael@secours.io).
