import { TreeType } from "icalts/dist/src/types";
import { OrganGlobalState } from "./context";
import { MatrixClient } from "matrix-js-sdk";

export type Action =
  | AddICalendarAction
  | SetClientAction
  | AddMatrixCalendarAction;

type AddICalendarAction = {
  type: "ADD_ICALENDAR";
  url: string;
  calendar: TreeType;
};

type AddMatrixCalendarAction = {
  type: "ADD_MATRIX_CALENDAR";
  roomId: string;
  events: any[];
};

type SetClientAction = {
  type: "SET_CLIENT";
  client: MatrixClient;
};

export function reducer(state: OrganGlobalState, action: Action) {
  switch (action.type) {
    case "ADD_ICALENDAR":
      console.log(`Adding calendar ${action.url}`);
      if (state.calendars.some(c => c.url === action.url)) {
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
          },
        ],
      };
    case "ADD_MATRIX_CALENDAR":
      console.log(`Adding calendar ${action.roomId}`);
      if (state.calendars.some(c => c.url === action.roomId)) {
        console.log(`Calendar already exists`);
        return state;
      }
      return {
        ...state,
        calendars: [
          ...state.calendars,
          {
            calendar: action.events,
            url: action.roomId,
          },
        ],
      };
    case "SET_CLIENT":
      return {
        ...state,
        client: action.client,
      };
    default:
      return state;
  }
}
