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

See [docs/schema.md](docs/schema.md) for the data model.

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
- ❌ Create new host (Matrix room)
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
