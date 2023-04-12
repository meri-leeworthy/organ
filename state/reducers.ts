import { TreeType } from "icalts/dist/src/types";
import { OrganGlobalState } from "./context";
import { MatrixClient } from "matrix-js-sdk";

type Action = AddCalendarAction | SetClientAction;

type AddCalendarAction = {
  type: "ADD_CALENDAR";
  url: string;
  calendar: TreeType;
};

type SetClientAction = {
  type: "SET_CLIENT";
  client: MatrixClient;
};

export function reducer(state: OrganGlobalState, action: Action) {
  switch (action.type) {
    case "ADD_CALENDAR":
      console.log(`Adding calendar ${action.url}`);
      return {
        ...state,
        calendars: [
          ...state.calendars,
          {
            calendar: { placeholder_key: "placeholder_calendar" },
            url: action.url,
          },
        ],
      };
    case "SET_CLIENT":
      console.log(`useReducer: Setting client`);
      return {
        ...state,
        client: action.client,
      };
    default:
      return state;
  }
}
