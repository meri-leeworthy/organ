import { TreeType } from "icalts/dist/src/types";
import { OrganGlobalState } from "./context";

type Action = AddCalendarAction;

type AddCalendarAction = {
  type: "ADD_CALENDAR";
  url: string;
  calendar: TreeType;
};

export function reducer(state: OrganGlobalState, action: Action) {
  switch (action.type) {
    case "ADD_CALENDAR":
      console.log(`Adding calendar ${action.url}`);
      return {
        ...state, //nothing currently
        calendars: [
          ...state.calendars,
          {
            calendar: { placeholder_key: "placeholder_calendar" },
            url: action.url,
          },
        ],
      };
    default:
      return state;
  }
}
