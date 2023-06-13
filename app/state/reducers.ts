import { valuesOrEmptyArray } from "app/lib/localStorage";
import { OrganGlobalState, Action } from "app/types";
import { Reducer } from "react";

// TODO: Matrix calendar add/delete should update the room list, so should event add/delete

export const reducer: Reducer<OrganGlobalState, Action> = (state, action) => {
  console.log(`reducer: ${JSON.stringify(action)}`);

  switch (action.type) {
    case "INITIALISE_STATE":
      const { type: ___, ...initialState } = action;
      return {
        ...state,
        ...initialState,
      };

    case "SET_CLIENT":
      return {
        ...state,
        client: action.client,
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
      const calendarsWithoutRoom = new Map(state.calendars);
      calendarsWithoutRoom.delete(action.roomId);
      return {
        ...state,
        calendars: calendarsWithoutRoom,
      };

    case "SET_MATRIX_EVENT":
      const { type: _, ...eventAdding } = action;
      const eventCalendar = state.calendars.get(action.calendarId)!;
      // if the calendar doesn't exist something is wrong... fix me

      const newCalendars = state.calendars.has(action.calendarId)
        ? new Map(state.calendars).set(action.calendarId, {
            ...eventCalendar,
            events: new Set(valuesOrEmptyArray(eventCalendar.events)).add(
              action.eventId
            ),
          })
        : state.calendars;

      return {
        ...state,
        calendars: newCalendars,
        events: new Map(state.events).set(action.eventId, eventAdding),
      };

    case "UPDATE_MATRIX_EVENT":
      const { type: __, ...eventUpdating } = action;

      return {
        ...state,
        events: new Map(state.events).set(action.eventId, eventUpdating),
      };

    case "DELETE_MATRIX_EVENT":
      const calendarId = state.events.get(action.eventId)!.calendarId;

      const events = new Map(state.events);
      events.delete(action.eventId);
      const calendarWithDeletedEvent = state.calendars.get(calendarId)!;
      const eventsWithoutEvent = new Set(
        valuesOrEmptyArray(calendarWithDeletedEvent.events)
      );
      eventsWithoutEvent.delete(action.eventId);
      const calendars = new Map(state.calendars).set(calendarId, {
        ...calendarWithDeletedEvent,
        events: eventsWithoutEvent,
      });

      return {
        ...state,
        events,
        calendars,
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
