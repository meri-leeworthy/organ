import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  OrganGlobalState,
  Action,
  AsyncStorageKey,
  AsyncStorageValue,
} from "../types";
import { Reducer } from "react";

export async function setAsyncStorage<T extends AsyncStorageKey>(
  key: T,
  value: AsyncStorageValue<T>
) {
  return await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getAsyncStorage<T extends AsyncStorageKey>(
  key: T
): Promise<AsyncStorageValue<T> | null> {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

export const reducer: Reducer<OrganGlobalState, Action> = (state, action) => {
  switch (action.type) {
    case "SET_CLIENT":
      return {
        ...state,
        client: action.client,
      };

    case "SET_MATRIX_ROOMS":
      console.log(`Setting matrix rooms`);
      setAsyncStorage("matrixRooms", [...action.matrixRooms.values()]); //could throw
      return {
        ...state,
        matrixRooms: action.matrixRooms,
      };

    case "ADD_MATRIX_ROOM":
      console.log(`Adding calendar ${action.roomName}`);
      const { type, ...roomAdding } = action;
      setAsyncStorage(action.roomId, roomAdding);
      if (state.calendars.has(action.roomId)) {
        console.log(`Calendar already exists`);
        return state;
      }

      // maybe instead of useMatrixClient we should be putting the rooms in the store here

      // this is where you would want to check the room to see if it has any calEvents?

      return {
        ...state,
        calendars: new Map(state.calendars).set(action.roomId, {
          events: action.events,
          roomName: action.roomName,
          roomId: action.roomId,
          isCalendar: true,
        }),
      };

    case "UPDATE_MATRIX_ROOM":
      console.log(`Setting calendar ${action.roomName}`);
      const { type: ___, ...roomUpdating } = action;
      setAsyncStorage(action.roomId, roomUpdating);
      return {
        ...state,
        calendars: new Map(state.calendars).set(action.roomId, roomUpdating),
      };

    case "DELETE_MATRIX_ROOM":
      console.log(`Deleting calendar ${action.roomId}`);
      AsyncStorage.removeItem(action.roomId);
      const calendarsWithoutRoom = new Map(state.calendars);
      calendarsWithoutRoom.delete(action.roomId);
      return {
        ...state,
        calendars: calendarsWithoutRoom,
      };

    case "ADD_MATRIX_EVENT":
      console.log(`Adding event ${action.name}`);

      const { type: _, ...eventAdding } = action;
      setAsyncStorage(action.eventId, eventAdding);

      const calendar = state.calendars.get(action.calendarId)!;
      // if the calendar doesn't exist something is wrong... fix me
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
        events: new Map(state.events).set(action.eventId, eventAdding),
      };

    case "UPDATE_MATRIX_EVENT":
      console.log(`Setting event ${action.name}`);

      const { type: __, ...eventUpdating } = action;
      setAsyncStorage(action.eventId, eventUpdating);

      return {
        ...state,
        events: new Map(state.events).set(action.eventId, eventUpdating),
      };

    case "DELETE_MATRIX_EVENT":
      console.log(`Deleting event ${action.eventId}`);

      const calendarId = state.events.get(action.eventId)!.calendarId;

      const events = new Map(state.events);
      events.delete(action.eventId);
      const calendarWithDeletedEvent = state.calendars.get(calendarId)!;
      const eventsWithoutEvent = new Set(
        calendarWithDeletedEvent.events?.values() || null
      );
      eventsWithoutEvent.delete(action.eventId);
      const calendars = new Map(state.calendars).set(calendarId, {
        ...calendarWithDeletedEvent,
        events: eventsWithoutEvent,
      });

      AsyncStorage.removeItem(action.eventId);

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
