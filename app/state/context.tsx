import * as sdk from "matrix-js-sdk";
import React, {
  createContext,
  Reducer,
  useContext,
  useEffect,
  useReducer,
} from "react";
import * as SecureStore from "expo-secure-store";
import { OrganGlobalState, Action } from "app/types";
import { setAsyncStorage } from "app/lib/localStorage";

export async function getClient() {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  if (!accessToken) {
    return undefined;
  }
  return sdk.createClient({
    baseUrl: "https://matrix.org",
    accessToken,
  });
}

export const StateContext = createContext<
  [OrganGlobalState, React.Dispatch<Action>]
>([
  {
    calendars: new Map(),
    // client: undefined,
    matrixRoomIds: new Set(),
    events: new Map(),
  },
  () => null,
]);

export const StateProvider = ({
  reducer,
  initialState,
  children,
}: {
  reducer: Reducer<OrganGlobalState, Action>;
  initialState: OrganGlobalState;
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { calendars, events, matrixRoomIds } = state;

  useEffect(() => {
    async function storeCalendars() {
      calendars.forEach((calendar, calendarId) => {
        console.log("storing calendar", calendar);
        setAsyncStorage(calendarId, calendar);
      });
    }
    storeCalendars();
  }, [calendars]);

  useEffect(() => {
    async function storeEvents() {
      events.forEach((event, eventId) => {
        console.log("storing eventId", eventId);
        setAsyncStorage(eventId, event);
      });
    }
    storeEvents();
  }, [events]);

  useEffect(() => {
    async function storeMatrixRoomIds() {
      console.log("storing matrixRoomIds", matrixRoomIds);
      if (matrixRoomIds.size > 0)
        setAsyncStorage("matrixRoomIds", [...matrixRoomIds.values()]);
    }
    storeMatrixRoomIds();
  }, [matrixRoomIds]);

  return (
    <StateContext.Provider value={[state, dispatch]}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateValue = () => useContext(StateContext);
