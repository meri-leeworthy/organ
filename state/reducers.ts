import { OrganGlobalState, Action } from "../types";
import { Reducer } from "react";

export const reducer: Reducer<OrganGlobalState, Action> = (state, action) => {
  switch (action.type) {
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
    case "ADD_MATRIX_CALENDAR":
      console.log(`Adding calendar ${action.roomName}`);
      if (state.calendars.has(action.roomId)) {
        console.log(`Calendar already exists`);
        return state;
      }

      // this is where you would want to check the room to see if it has any calEvents

      return {
        ...state,
        calendars: new Map(state.calendars).set(action.roomId, {
          events: action.events,
          roomName: action.roomName,
          roomId: action.roomId,
        }),
      };
    case "SET_MATRIX_ROOMS":
      console.log(`Setting matrix rooms`);
      return {
        ...state,
        matrixRooms: action.matrixRooms,
      };
    case "SET_CLIENT":
      return {
        ...state,
        client: action.client,
      };
    case "ADD_MATRIX_EVENT":
      console.log(`Adding event ${action.name}`);
      // adds events to Map even if calendar doesn't exist in store
      const calendar = state.calendars.get(action.calendarId)!;
      const newCalendars = state.calendars.has(action.calendarId)
        ? new Map(state.calendars).set(action.calendarId, {
            ...calendar,
            events: new Set(calendar.events?.values() || null).add(
              action.eventId
            ),
          })
        : state.calendars;
      return {
        ...state,
        calendars: newCalendars,
        events: new Map(state.events).set(action.eventId, {
          name: action.name,
          date: action.date,
          description: action.description,
          venue: action.venue,
          eventId: action.eventId,
        }),
      };
    default:
      return state;
  }
};
