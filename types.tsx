/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TreeType } from "icalts/dist/src/types";
import { MatrixClient } from "matrix-js-sdk";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// export type RootStackParamList = {
//   Root: NavigatorScreenParams<RootTabParamList> | undefined;
//   Login: undefined;
//   NotFound: undefined;
//   Event: { eventName: string; uid: string };
// };

export type RootStackParamList = {
  Root: { drawerIsOpen: boolean };
  Login: undefined;
  CreateEvent: undefined;
  NotFound: undefined;
  Event: { eventId: string; eventName: string };
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

// export type RootTabParamList = {
//   Events: { drawerIsOpen: boolean };
//   Settings: undefined;
// };

// export type RootTabScreenProps<Screen extends keyof RootTabParamList> =
//   CompositeScreenProps<
//     BottomTabScreenProps<RootTabParamList, Screen>,
//     NativeStackScreenProps<RootStackParamList>
//   >;

// type MatrixRoomID = `!${string}:${string}`;
type MatrixRoomID = string;
type CalendarID = MatrixRoomID;
// type MatrixEventID = `$${string}`;
export type MatrixEventID = string;

type DirectoryRadicalEventV1 = {
  date: Date;
  name: string;
  description: string;
  venue: string;
  eventId: MatrixEventID;
  calendarId: CalendarID;
};

export type MatrixCalendarEvent = DirectoryRadicalEventV1;

export type MatrixRoom = {
  events: Set<MatrixEventID> | {};
  roomName: string;
  roomId: MatrixRoomID;
  isCalendar: boolean;
};

export type MatrixRoomList = Set<MatrixRoomID>;

// export type ICalendar = {
//   calendar: TreeType;
//   url: string;
//   name: string;
// };

type Calendar = MatrixRoom;

export type OrganGlobalState = {
  calendars: Map<CalendarID, Calendar>;
  client: MatrixClient | undefined;
  matrixRoomIds: MatrixRoomList;
  events: Map<MatrixEventID, MatrixCalendarEvent>;
};

type DataAction<TData extends {}, TName extends string> = TData & {
  type: TName;
};

export type Action =
  | DataAction<{ client: MatrixClient }, "SET_CLIENT">
  | DataAction<{ matrixRooms: MatrixRoomList }, "SET_MATRIX_ROOMS">
  // | DataAction<ICalendar, "ADD_ICALENDAR">
  | DataAction<MatrixRoom, "ADD_MATRIX_ROOM">
  | DataAction<MatrixRoom, "UPDATE_MATRIX_ROOM">
  | DataAction<{ roomId: MatrixRoomID }, "DELETE_MATRIX_ROOM">
  | DataAction<MatrixCalendarEvent, "ADD_MATRIX_EVENT">
  | DataAction<MatrixCalendarEvent, "UPDATE_MATRIX_EVENT">
  | DataAction<{ eventId: MatrixEventID }, "DELETE_MATRIX_EVENT">;

export type AsyncStorageKey = "matrixRooms" | MatrixRoomID | MatrixEventID;
export type AsyncStorageValue<T> = T extends "matrixRooms"
  ? MatrixRoomID[]
  : T extends MatrixRoomID | MatrixEventID
  ? MatrixRoom | MatrixCalendarEvent
  : never;
