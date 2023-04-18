import { TreeType } from "icalts/dist/src/types";
import * as sdk from "matrix-js-sdk";
import React, { createContext, Reducer, useContext, useReducer } from "react";

import * as SecureStore from "expo-secure-store";
import { Action } from "./reducers";

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
export type LinkedCalendar = {
  calendar: TreeType;
  url: string;
};

export type OrganGlobalState = {
  calendars: LinkedCalendar[];
  client: sdk.MatrixClient | undefined;
};

export const StateContext = createContext<
  [OrganGlobalState, React.Dispatch<Action>]
>([{ calendars: [], client: undefined }, () => null]);

export const StateProvider = ({
  reducer,
  initialState,
  children,
}: {
  reducer: Reducer<OrganGlobalState, Action>;
  initialState: OrganGlobalState;
  children: React.ReactElement;
}) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);

export const useStateValue = () => useContext(StateContext);
