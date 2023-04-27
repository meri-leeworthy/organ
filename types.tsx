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

export type MatrixRoom = {
  roomName: string;
  roomId: MatrixRoomID;
};

export type MatrixRoomList = MatrixRoom[];

type DirectoryRadicalEventV1 = {
  date: Date;
  name: string;
  description: string;
  venue: string;
  eventId: MatrixEventID;
};

export type MatrixCalendarEvent = DirectoryRadicalEventV1;

type MatrixEventID = string;

export type MatrixCalendar = MatrixRoom & {
  events: Set<MatrixEventID>;
};

// export type ICalendar = {
//   calendar: TreeType;
//   url: string;
//   name: string;
// };

type MatrixRoomID = string;
type Calendar = MatrixCalendar;
type CalendarID = MatrixRoomID;

export type OrganGlobalState = {
  calendars: Map<CalendarID, Calendar>;
  client: MatrixClient | undefined;
  matrixRooms: MatrixRoomList;
  events: Map<MatrixEventID, MatrixCalendarEvent>;
};

type DataAction<TData extends {}, TName extends string> = TData & {
  type: TName;
};

export type Action =
  | DataAction<{ client: MatrixClient }, "SET_CLIENT">
  | DataAction<{ matrixRooms: MatrixRoomList }, "SET_MATRIX_ROOMS">
  // | DataAction<ICalendar, "ADD_ICALENDAR">
  | DataAction<MatrixCalendar, "ADD_MATRIX_CALENDAR">
  | (DataAction<MatrixCalendarEvent, "ADD_MATRIX_EVENT"> & {
      calendarId: CalendarID;
      eventId: MatrixEventID;
    });
