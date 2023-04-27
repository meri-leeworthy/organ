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
  Event: { eventName: string; uid: string };
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
  roomId: string;
};

export type MatrixRoomList = MatrixRoom[];

type DirectoryRadicalEventV1 = {
  date: Date;
  name: string;
  description: string;
  venue: string;
};

export type MatrixEvent = DirectoryRadicalEventV1;

export type MatrixCalendar = MatrixRoom & {
  events: MatrixEvent[];
};

// export type ICalendar = {
//   calendar: TreeType;
//   url: string;
//   name: string;
// };

type Calendar = MatrixCalendar;

export type OrganGlobalState = {
  calendars: Calendar[];
  client: MatrixClient | undefined;
  matrixRooms: MatrixRoomList;
};

type DataAction<TData extends {}, TName extends string> = TData & {
  type: TName;
};

export type Action =
  // | DataAction<ICalendar, "ADD_ICALENDAR">
  | DataAction<MatrixCalendar, "ADD_MATRIX_CALENDAR">
  | DataAction<{ client: MatrixClient }, "SET_CLIENT">
  | DataAction<{ matrixRooms: MatrixRoomList }, "SET_MATRIX_ROOMS">
  | (DataAction<MatrixEvent, "ADD_MATRIX_EVENT"> & { roomId: string });
