# Test Plan

Based on the Invariants in the Specification.md file, we will run the following tests:

## Build Verification Test

1. Open Edge with https://soterialct.z22.web.core.windows.net/room
2. Open Chrome with https://soterialct.z22.web.core.windows.net/visitor
3. Open Firefox with https://soterialct.z22.web.core.windows.net/visitor

This gives you three distinct connections. One Room and two Visitors

The first BVT

1. Open a Room
2. Give a Visitor a name, Select the Available Room, and Check-in
3. Repeat for second visitor
4. Click the Warn Rooms for either Visitor
5. You should see alerts in all browsers

You can repeat this test by simply reselecting Warn Room

Next tests will include adding a visitor on a different non-exposure date to ensure no alert raised for that visitor.

Another test in development is testing Invariant 3.2.2
