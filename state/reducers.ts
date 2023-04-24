import { ICalendar, OrganGlobalState, Action } from "../types";
import { Reducer } from "react";

export const reducer: Reducer<OrganGlobalState, Action> = (state, action) => {
  switch (action.type) {
    case "ADD_ICALENDAR":
      console.log(`Adding calendar ${action.url}`);
      if (state.calendars.some(c => "url" in c && c.url === action.url)) {
        console.log(`Calendar already exists`);
        return state;
      }
      return {
        ...state,
        calendars: [
          ...state.calendars,
          {
            calendar: action.calendar,
            url: action.url,
            name: action.name,
          },
        ],
      };
    case "ADD_MATRIX_CALENDAR":
      console.log(`Adding calendar ${action.roomId}`);
      if (
        state.calendars.some(c => "roomId" in c && c.roomId === action.roomId)
      ) {
        console.log(`Calendar already exists`);
        return state;
      }
      return {
        ...state,
        calendars: [
          ...state.calendars,
          {
            events: action.events,
            roomId: action.roomId,
            roomName: action.roomName,
          },
        ],
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
    default:
      return state;
  }
};
