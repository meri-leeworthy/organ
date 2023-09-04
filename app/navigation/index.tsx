/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { ColorSchemeName } from "react-native";
import LinkingConfiguration from "./LinkingConfiguration";
import { RootNavigator } from "app/screens/stack";
import { useEffect } from "react";
import { getAsyncStorage } from "app/lib/localStorage";
import {
  MatrixCalendarEvent,
  MatrixCalendarRoom,
  MatrixRoom,
  MatrixStandardRoom,
} from "app/types";
import { useStateValue } from "app/state/context";
import { z } from "zod";
// import { parsedIcal } from "app/state/fileSample";

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  const [_, dispatch] = useStateValue();

  // Load data from local storage into global state
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const parsedMatrixRooms = await getAsyncStorage("matrixRoomIds");
    if (!parsedMatrixRooms) return;

    const parsedRooms = await Promise.all(
      parsedMatrixRooms.map((roomId: string) => getRoom(roomId))
    );

    const parsedCalendars = parsedRooms.filter(
      parsedRoom => "data" in MatrixCalendarRoom.safeParse(parsedRoom[1])
    );

    const validatedCalendars = z
      .array(z.tuple([z.string(), MatrixCalendarRoom]))
      .parse(parsedCalendars);
    if (!validatedCalendars) return;

    const parsedStandardRooms = parsedRooms.filter(
      parsedRoom => "data" in MatrixStandardRoom.safeParse(parsedRoom[1])
    );

    const validatedStandardRooms = z
      .array(z.tuple([z.string(), MatrixStandardRoom]))
      .parse(parsedStandardRooms);
    if (!validatedStandardRooms) return;

    const eventIdsMap = validatedCalendars.map(cal => cal[1].events);
    const eventIds = z.array(z.string()).parse([...eventIdsMap.values()]);

    console.log("eventIdsMap values", [...eventIdsMap.values()]);

    const parsedEvents = await Promise.all(
      eventIds.map((eventId: string) => getEvent(eventId))
    );

    const validatedEvents = z
      .array(z.tuple([z.string(), MatrixCalendarEvent]))
      .parse(parsedEvents);

    dispatch({
      type: "INITIALISE_STATE",
      user: {},
      calendars: new Map(validatedCalendars),
      events: new Map(validatedEvents),
      matrixRoomIds: new Set(parsedMatrixRooms),
      standardRooms: new Map(validatedStandardRooms),
    });
  };

  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

async function getRoom(roomId: string): Promise<[string, MatrixRoom]> {
  const room = await getAsyncStorage<string, MatrixRoom>(roomId);
  if (!room) throw new Error("Room not found");
  return [roomId, room];
}

async function getEvent(
  eventId: string
): Promise<[string, MatrixCalendarEvent]> {
  const event = await getAsyncStorage<string, MatrixCalendarEvent>(eventId);
  if (!event) throw new Error("Event not found");
  return [eventId, event];
}
