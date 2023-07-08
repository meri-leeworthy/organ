/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */
import { z } from "zod";

import { DrawerScreenProps } from "@react-navigation/drawer";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  Drawer: undefined;
  Login: { isAuthenticated: boolean };
  CreateEvent: { calendar: MatrixRoomID };
  EditFollows: undefined;
  NotFound: undefined;
  Event: { eventId: string; eventName: string };
  ChooseHost: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type RootDrawerParamList = {
  Home: undefined;
  Calendar: undefined;
  Hosting: undefined;
  Following: undefined;
  Explore: undefined;
  Account: undefined;
  Settings: undefined;
};

export type RootDrawerScreenProps<Screen extends keyof RootDrawerParamList> =
  DrawerScreenProps<RootDrawerParamList, Screen>;

// type MatrixRoomID = `!${string}:${string}`;
const MatrixRoomID = z.string();
type MatrixRoomID = z.infer<typeof MatrixRoomID>;
const CalendarID = MatrixRoomID;
type CalendarID = MatrixRoomID;

const MatrixEventID = z.string();
type MatrixEventID = z.infer<typeof MatrixEventID>;

// type MatrixEventID = `$${string}`;

const DirectoryRadicalEventUnstable = z.object({
  date: z.date(),
  name: z.string(),
  description: z.string(),
  venue: z.string(),
  eventId: MatrixEventID,
  rootEventRoomId: z.string(),
});

type DirectoryRadicalEventUnstable = z.infer<
  typeof DirectoryRadicalEventUnstable
>;

const DirectoryRadicalEventRootUnstable = DirectoryRadicalEventUnstable.extend({
  sharedEventIds: z.map(CalendarID, MatrixEventID),
});

type DirectoryRadicalEventRootUnstable = z.infer<
  typeof DirectoryRadicalEventRootUnstable
>;

export const MatrixCalendarEvent = DirectoryRadicalEventRootUnstable;
export type MatrixCalendarEvent = DirectoryRadicalEventRootUnstable;

export const MatrixStandardRoom = z.object({
  roomName: z.string(),
  roomId: MatrixRoomID,
  roomType: z.undefined(), //should be stored in the room state
});

export type MatrixStandardRoom = z.infer<typeof MatrixStandardRoom>;

export const MatrixCalendarRoom = z.object({
  roomName: z.string(),
  roomId: MatrixRoomID,
  roomType: z.literal("calendar"),
  events: z.map(MatrixRoomID, MatrixEventID), //room id of room where root event is stored
});

export type MatrixCalendarRoom = z.infer<typeof MatrixCalendarRoom>;

export const MatrixRootEventRoom = z.object({
  roomName: z.string(),
  roomId: MatrixRoomID,
  roomType: z.literal("event"),
  rootEventId: MatrixEventID,
});

export type MatrixRootEventRoom = z.infer<typeof MatrixRootEventRoom>;

const MatrixRoom = z.union([
  MatrixStandardRoom,
  MatrixCalendarRoom,
  MatrixRootEventRoom,
]);
export type MatrixRoom =
  | MatrixStandardRoom
  | MatrixCalendarRoom
  | MatrixRootEventRoom;

const MatrixRoomList = z.set(MatrixRoomID);
export type MatrixRoomList = Set<MatrixRoomID>;

// export type ICalendar = {
//   calendar: TreeType;
//   url: string;
//   name: string;
// };

export type ClientSyncState =
  | null
  | "PREPARED"
  | "SYNCING"
  | "STOPPED"
  | "CATCHUP"
  | "RECONNECTING"
  | "ERROR";

const Calendar = MatrixCalendarRoom;
type Calendar = MatrixCalendarRoom;

const OrganGlobalState = z.object({
  calendars: z.map(CalendarID, Calendar),
  standardRooms: z.map(MatrixRoomID, MatrixStandardRoom),
  matrixRoomIds: MatrixRoomList,
  events: z.map(MatrixEventID, MatrixCalendarEvent),
});

export type OrganGlobalState = z.infer<typeof OrganGlobalState>;

type DataAction<TData extends {}, TName extends string> = TData & {
  type: TName;
};

export type Action =
  | DataAction<OrganGlobalState, "INITIALISE_STATE">
  // | DataAction<{ client: MatrixClient }, "SET_CLIENT">
  | DataAction<{ matrixRooms: MatrixRoomList }, "SET_MATRIX_ROOMS">
  // | DataAction<ICalendar, "ADD_ICALENDAR">
  | DataAction<MatrixRoom, "SET_MATRIX_CALENDAR">
  | DataAction<{ roomId: MatrixRoomID }, "DELETE_MATRIX_CALENDAR">
  | DataAction<MatrixCalendarEvent, "SET_MATRIX_EVENT">
  | DataAction<{ eventId: MatrixEventID }, "DELETE_MATRIX_EVENT">
  | DataAction<MatrixStandardRoom, "SET_MATRIX_STANDARD_ROOM">
  | DataAction<{ roomId: MatrixRoomID }, "DELETE_MATRIX_STANDARD_ROOM">;

export type AsyncStorageKey = "matrixRoomIds" | MatrixRoomID | MatrixEventID;
export type AsyncStorageValue<T, U> = T extends "matrixRoomIds"
  ? MatrixRoomID[]
  : U;

export const IsCalendarEventType = z.literal("directory.radical.isCalendar");
export const RootEventIdEventType = z.literal("directory.radical.rootEventId");
export const EventUnstableEventType = z.literal(
  "directory.radical.event.unstable"
);
