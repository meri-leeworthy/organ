# Organ

Organ is a mobile app for managing and sharing your calendar and social events.
It allows you to publish one or multiple host calendars that anyone can
subscribe to, and get notifications when new events or updates are posted by
hosts you follow. It is intended as an open source alternative to Facebook
Events, with a focus on groups and organisations, interoperability,
decentralised governance and data sovereignty. It is built on Matrix, an open
protocol for secure, decentralized communication.

## Development

Organ is a React Native app managed with Expo.

Clone the repo and run `npx expo install` to install dependencies.

To run Organ locally, run `npx expo start`.

### Matrix

Organ uses the [matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk/) to
communicate with Matrix homeservers. The data model is likely to change and is
currently as follows: Matrix rooms are used to represent host calendars, with
caledar events stored as Matrix events in the room timeline. Each event is a
custom Matrix message event, `directory.radical.event.vX.X`, and contains the
event name, start and end times, venue, and other metadata. Each of these can
then become a thread in the room, in which users can post comments and ask
questions.

An alternative under consideration is that each event is itself a Matrix room.
This would allow for more fine-grained control over access to events, and would
allow for events to be shared between calendars. This could also allow a more
Facebook-style posts and replies model, as each post could be the start of a
thread. The challenge to this approach right now lies in distributing metadata
about events between calendars in a way that allows that metadata to be
encrypted (i.e. not part of the room state) while avoiding inconsistencies
between calendars.

## Features

### Authentication:

- ✅ Username and password login
- ❌ Select homeserver (currently hardcoded to matrix.org)
- ❌ Registration
- ❌ Password reset
- ❌ Logout
- ❌ OIDC login

### Calendars

- ✅ List Matrix rooms
- ✅ Add Matrix room to list of calendars
- ❌ Create new Matrix room
- ❌ Remove Matrix room from list of calendars
- ❌ Leave Matrix room

### Events

- ✅ List events from Matrix rooms
- 🛠️ Create new event
  - ❌ Upload header image from gallery
- ❌ Edit event
- ❌ Delete event
- ❌ RSVP to event
- ❌ Invite friends to event
- ❌ Share event
- ❌ Post in event

### Notifications

- ❌ Notifications when new events are posted by hosts you follow
- ❌ Notifications when events you RSVPed to are updated
- ❌ Notifications when posts are made in events you RSVPed to

### Settings

- ❌ Change display name
- ❌ Change avatar
- ❌ Change notification settings

### Bigger features for once the basics are done

- ❌ Discover new hosts and events
- ❌ Use phone contacts for discovery
- ❌ Import and export events from/to iCal
- ❌ Share events with friends using email and SMS
- ❌ End-to-end encryption for host calendars
