import * as sdk from "matrix-js-sdk";
import React, { createContext, Reducer, useContext, useReducer } from "react";
import * as SecureStore from "expo-secure-store";
import { OrganGlobalState, Action, MatrixEvent } from "../types";

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
>([{ calendars: [], client: undefined, matrixRooms: [] }, () => null]);

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
