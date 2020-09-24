# Test Plan

Based on the Invariants in the Specification.md file, we will run the following tests:

## Configuration

Rooms:

| Room               | userAgent   | url                             |
| ------------------ | ----------- | ------------------------------- |
| Heathlands.Medical | Chrome      | http://localhost:8080/room      |
| ABMS.Medical       | Edge        | http://localhost:8080/room      |
| AirGas             | FireFox Dev | http://localhost:8080/visitor   |
| Nurse Diesel       | Chrome      | http://192.168.1.9:8080/visitor |
| Nurse Jackie       | FireFox 80  | http://localhost:8080/visitor   |

## Build Verification Tests

It is important to **restart the socket.io server** to accurately run BVTs.

With a Room vue open, when the server starts, it will reconnect with the Room. This will send an event to all Visitors that the Room is now open, and the `Visit Room` dropdown will include the name of Room.

Next, ensure the Visitor vues are initialized:

1. Check the `See all visits` box in all Visitor vues
2. If there are no old visits listed
   1. Click the `Refresh` button else
   2. Click the `DELETE ALL VISITS` button (this will delete visits and refresh the page)

### 1: Most basic test

1. Open a Room vue and two Visitor vues
2. Restart the socket.io server
3. You will see the Room name in the `Visit Room` dropdown
4. Use, enter, or select a Visitor name
5. Click the YES button to enter the Room
6. Repeat for second visitor
7. Click the Warn Rooms for either Visitor
8. You should see alerts in all browsers

You can repeat this test by simply reselecting Warn Room

### 2: Multiple Visitors with two Rooms

1. Open second Room
2. Open three Visitor windows
3. Two Visitors check-in to a single Room
4. Warn Rooms
5. Only the single Room sees alert
6. Only the two Visitors see alerts
7. The warning Visitor sees a CONFIRMATION ack to the alert
8. The other Visitor sees a BE ADVISED ack to the alert

### 3: Pending Rooms and late Alerts to Visitors

1. AirGas visits both Rooms (you can test for auto check-out by changing room before Checking out)
2. Nurse Diesel checks into ABMS.Medical
3. Nurse Jackie checks into Heathland.Medical
4. Restart the socket.io Server
5. Refresh Heathlands.Medical (do not refresh ABMS.Medical)
6. Refresh all Visitors
7. AirGas warns Heathlands.Medical and ABMS.Medical
8. AirGas sees CONFIRMING ack from Warning
9. Nurse Jackie sees BE ADVISED ack from Warning
10. Nurse Diesel is unaffected by AirGas Warning
11. Refresh ABMS.Medical
12. Nurse Jackie sees BE ADVISED ack from AirGas's (late) Warning
13. Nurse Disel sees BE ADVISED ack from AirGas's (late) Warning
14. Test Passed

4: Test past visits

First set of tests used current day for visits. This set simulates a week of visits to two rooms by three people.

1. Start with a blank configuration (see 3.1 above)
2. Click YES for each Visitor so they are all in a Room
3. To add rancom test dates for each Visitor, click the test tube icon in the lower right corner of the system bar in the middle of the window
4. Repeat for an even distribution of visits in the past
5. Test alerts for Visitor with each Room Warning
