# Local Contact Tracing -- Specification V0.5

This document stipulates the rationale and resolution of forces that make the essential Local Contact Tracing app.

## 1.0 The Players

LCT consists in a set of **public spaces** called Rooms and a set of **private individuals** called Visitors and a multiset of Occupants. Data needs to discriminate these sets by name convention.

### 1.1 Rooms

1.1.1 **Room** identity MUST:

- Name the **building**
- Name the **room**, itself (a room name can be generic; e.g., "inside" or "outside")
- Be **unique** in the network (see Network Section below)
- Be **identifying** names in the public domain (there is no presumption of privacy)

### 1.2 Visitors

1.2.1 **Visitor** identity MUST:

- Be **unique** in the network
- Use less than 20 characters
- Cannot include a '.' character

  1.2.2 Visitor identity MAY be one of:

- anonymous
- pseudonymous
- identifying

## 2.0 The Network

The word network can refer to (tangible) infrastructure or (intangible) organization structure.

### 2.1 Infrastructure

In this design, socket.io provides the network infrastructure. Each organization structure has a namespace. Names must be unique within this namespace. If an individual is active in more than one organization structure, they can use the same name in all namespaces.

### 2.2 Organization Structure

How private individuals interact in public determines organization structure.

#### 2.2.1 Offices

A common example of organization structure in the network is an office. Here, (the same) employees interact in generally accepted ways.

#### 2.2.2 Businesses

Another common example of network organization structure are retailers. Here, a variety of private indivicuals will interact in novel ways.

#### 2.2.3 Special Cases

Care Centers exemplify an important category of network organization structure: the matrix. Here more than one Care Center may employ more than one private individual. When individuals are front-line care workers, the risk they pose to each other as they move through the network can be higher than in most other structures.

#### 2.2.4 Geography

Geographic limits provide the final category of network organization. For example, a small town can provide the organzition structure for a local contact tracing network. This network can admit any other structure.

## 3.0 Invariants

To work properly, LCT must comport closely with human behavior.

### 3.1 Room Conditions

3.1.1 For example, a Visitor MAY enter a Room, but first, the Room MUST be open physically.

3.1.2 On the other hand, there can be no restrictions on processing a virus exposure alert. To alert past occupants, MUST be online, but a Room MAY be closed.

### 3.2 Visitor Conditions

3.2.1 In this design, to see a virus exposure alert, a Visitors MUST be connected to the network.

3.2.2 The Visitor MAY be in a Room when the alert from another Room arrives. If a Visitor is not online the moment a Room raises the virus exposure alert to Visitors, the Room MUST notify the Visitor the next time the Visitor connects to the network.
