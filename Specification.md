# Local Contact Tracing -- Specification V0.5

This document stipulates the rationale and resolution of forces that make the essential Local Contact Tracing app.

## Players

LCT consists in a set of **public spaces** called Rooms and a set of **private individuals** called Visitors and a multiset of Occupants. Data needs to discriminate these sets by name convention.

### Rooms

**Room** identity MUST:

- Name the **building**
- Name the **room**, itself (a room name can be generic; e.g., "inside" or "outside")
- Be **unique** in the network (see Network Section below)
- Be **identifying** names in the public domain (there is no presumption of privacy)

### Visitors

**Visitor** identity MUST:

- Be **unique** in the network
- Use less than 20 characters
- Cannot include a '.' character

Visitor identity MAY be one of:

- anonymous
- pseudonymous
- identifying

## The Network

The word network can refer to (tangible) infrastructure or (intangible) organization structure.

### Infrastructure

In this design, socket.io provides the network infrastructure. Each organization structure has a namespace. Names must be unique within this namespace. If an individual is active in more than one organization structure, they can use the same name in all namespaces.

### Organization Structure

How private individuals interact in public determines organization structure.

#### Offices

A common example of organization structure in the network is an office. Here, (the same) employees interact in generally accepted ways.

#### Businesses

Another common example of network organization structure are retailers. Here, a variety of private indivicuals will interact in novel ways.

#### Special Cases

Care Centers exemplify an important category of network organization structure: the matrix. Here more than one Care Center may employ more than one private individual. When individuals are front-line care workers, the risk they pose to each other as they move through the network can be higher than in most other structures.

#### Geography

Geographic limits provide the final category of network organization. For example, a small town can provide the organzition structure for a local contact tracing network. This network can admit any other structure.

## Invariants

To work properly, LCT must comport closely with human behavior.

### Room Conditions

For example, a Visitor MAY enter a Room, but first, the Room MUST be open physically.

On the other hand, there can be no restrictions on processing a virus exposure alert. To alert past occupants, a Room MAY be closed.

### Visitor Conditions

In this design, to see a virus exposure alert, a Visitors MUST be connected to the network.

The Visitor MAY be in a Room when the alert from another Room arrives. If a Visitor is not online the moment a Room raises the virus exposure alert to Visitors, the Room MUST notify the Visitor the next time the Visitor connects to the network.
