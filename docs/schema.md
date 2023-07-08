### Matrix

Organ uses the [matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk/) to
communicate with Matrix homeservers. The data model will continue evolving but
is currently as follows: Matrix rooms are used to represent host calendars, with
calendar events represented as Matrix events in the room timeline. Each event is
a custom Matrix message event, `directory.radical.event.unstable` (to be
replaced with a versioned event type), and contains the event name, start and
end times, venue, and other metadata.

Each event contains the room ID of its 'root event room', which contains the
canonical `root` representation of that event. This allows events to be shared
between multiple calendars, and for multiple hosts to collaborate on the same
event. The root event room is the room that the event was created in, and is the
room that the event host has the most control over. The root event room is also
the room that the event host can use to communicate with event attendees.

#### Encrypted events

Some events are private and should not share their metadata in the room state,
as this is not encrypted. However, event hosts sometimes invite guests to invite
their trusted friends. It should be possible in this case for users to
discerningly share encrypted event descriptions in a kind of web of trust. In
this case, shared `directory.radical.event.unstable` events are essentially
shallow copies of the event metadata. Users who share events in calendars are
therefore responsible for updating these copies. This kind of pseudo overlay
network on top of Matrix isn't ideal and makes inconsistencies possible, but it
enables the possibility that event metadata can be securely shared between
encrypted rooms.
