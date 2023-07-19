import { mapEntriesOrEmptyArray, replacer } from "app/lib/localStorage";
import { OrganGlobalState, Action } from "app/types";
import { Reducer } from "react";

// TODO: Matrix calendar add/delete should update the room list, so should event add/delete

export const reducer: Reducer<OrganGlobalState, Action> = (state, action) => {
  console.log(`reducer: ${JSON.stringify(action, replacer)}`);

  switch (action.type) {
    case "INITIALISE_STATE":
      const { type: ___, ...initialState } = action;
      return {
        ...state,
        ...initialState,
      };

    case "SET_MATRIX_ROOMS":
      return {
        ...state,
        matrixRooms: action.matrixRooms,
      };

    case "SET_MATRIX_CALENDAR":
      if (action.roomType !== "calendar") {
        console.log(`Not a calendar`);
        return state;
      }

      const { type, ...calendar } = action;

      return {
        ...state,
        calendars: new Map(state.calendars).set(action.roomId, calendar),
      };

    case "DELETE_MATRIX_CALENDAR":
      const calendarsWithoutCalendar = new Map(state.calendars);
      calendarsWithoutCalendar.delete(action.roomId);

      return {
        ...state,
        calendars: calendarsWithoutCalendar,
      };

    case "SET_MATRIX_EVENT":
      const { type: _, ...newEvent } = action;
      const eventCalendar = state.calendars.get(action.rootEventRoomId);

      if (!eventCalendar) {
        console.log(`No calendar found for event ${action.eventId}`);
        return state;
      }

      const newCalendars = state.calendars.has(action.rootEventRoomId)
        ? new Map(state.calendars).set(action.rootEventRoomId, {
            ...eventCalendar,
            events: new Map(mapEntriesOrEmptyArray(eventCalendar?.events)).set(
              action.rootEventRoomId,
              action.eventId
            ),
          })
        : state.calendars;

      return {
        ...state,
        calendars: newCalendars,
        events: new Map(state.events).set(action.eventId, newEvent),
      };

    case "DELETE_MATRIX_EVENT":
      if (!state.events.has(action.eventId)) {
        console.log(`No event found for event ${action.eventId}`);
        return state;
      }

      const calendarId = state.events.get(action.eventId)!.rootEventRoomId;
      const events = new Map(state.events);
      events.delete(action.eventId);

      if (!state.calendars.has(calendarId)) {
        console.log(`No calendar found for event ${action.eventId}`);
        return { ...state, events };
      }

      const calendarWithDeletedEvent = state.calendars.get(calendarId)!;
      const calendarEventsWithoutEvent = new Map(
        mapEntriesOrEmptyArray(calendarWithDeletedEvent.events)
      );

      calendarEventsWithoutEvent.delete(action.eventId);

      return {
        ...state,
        events,
        calendars: new Map(state.calendars).set(calendarId, {
          ...calendarWithDeletedEvent,
          events: calendarEventsWithoutEvent,
        }),
      };

    case "SET_MATRIX_STANDARD_ROOM":
      const { type: ___type, ...standardRoom } = action;

      return {
        ...state,
        standardRooms: new Map(state.standardRooms).set(
          action.roomId,
          standardRoom
        ),
      };

    case "DELETE_MATRIX_STANDARD_ROOM":
      const standardRoomsWithoutRoom = new Map(state.standardRooms);
      standardRoomsWithoutRoom.delete(action.roomId);

      return {
        ...state,
        standardRooms: standardRoomsWithoutRoom,
      };
    default:
      return state;
  }
};

// case "ADD_ICALENDAR":
//   console.log(`Adding calendar ${action.url}`);
//   if (state.calendars.some(c => "url" in c && c.url === action.url)) {
//     console.log(`Calendar already exists`);
//     return state;
//   }
//   return {
//     ...state,
//     calendars: [
//       ...state.calendars,
//       {
//         calendar: action.calendar,
//         url: action.url,
//         name: action.name,
//       },
//     ],
//   };
