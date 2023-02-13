import { TreeType } from "icalts/dist/src/types";
import React, { createContext, Reducer, useContext, useReducer } from "react";

export type OrganGlobalState = {
  calendars: TreeType[];
};

export const StateContext = createContext<
  [OrganGlobalState, React.Dispatch<any>]
>([{ calendars: [] }, () => null]);

export const StateProvider = ({
  reducer,
  initialState,
  children,
}: {
  reducer: Reducer<OrganGlobalState, any>;
  initialState: OrganGlobalState;
  children: React.ReactElement;
}) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);

export const useStateValue = () => useContext(StateContext);
