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

1: Most basic test

1. Open a Room
2. Give a Visitor a name, Select the Available Room, and Check-in
3. Repeat for second visitor
4. Click the Warn Rooms for either Visitor
5. You should see alerts in all browsers

You can repeat this test by simply reselecting Warn Room

2: Multiple Visitors with two Rooms

1. Open second Room
2. Open three Visitor windows
3. Two Visitors check-in to a single Room
4. Warn Rooms
5. Only the single Room sees alert
6. Only the two Visitors see alerts
7. The warning Visitor sees a CONFIRMATION ack to the alert
8. The other Visitor sees a BE ADVISED ack to the alert

3: Pending Rooms and late Alerts to Visitors

1. Start with a blank configuration
   1. Check the `See all visits` box in all five windows
   2. `Delete` a message (and all messages disappear)
   3. Click the Refresh button (to the right of `See all visits` checkbox )
2. AirGas visits both Rooms (you can test for auto check-out by changing room before Checking out)
3. Nurse Diesel checks into ABMS.Medical
4. Nurse Jackie checks into Heathland.Medical
5. Restart the socket.io Server
6. Refresh Heathlands.Medical (do not refresh ABMS.Medical)
7. Refresh all Visitors
8. AirGas warns Heathlands.Medical and ABMS.Medical
9. AirGas sees CONFIRMING ack from Warning
10. Nurse Jackie sees BE ADVISED ack from Warning
11. Nurse Diesel is unaffected by AirGas Warning
12. Refresh ABMS.Medical
13. Nurse Jackie sees BE ADVISED ack from AirGas's (late) Warning
14. Nurse Disel sees BE ADVISED ack from AirGas's (late) Warning
15. Test Passed

4: Different Visit Dates

This test ensures that rich mixtures of visit dates and Visitors sends appropriate alerts.

1. Start with a blank configuration (see 3.1 above)
2. Click YES for each Visitor so they are all in a Room
3. To add rancom test dates for each Visitor, click the test tube icon in the lower right corner of the system bar in the middle of the window
4. Repeat for an even distribution of visits in the past
5. Test alerts for Visitor with each Room Warning
