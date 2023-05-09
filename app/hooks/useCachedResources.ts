import { FontAwesome } from "@expo/vector-icons";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
  MatrixCalendarEvent,
  MatrixEventID,
  MatrixRoom,
  MatrixRoomList,
} from "app/types";
import {
  getAsyncStorage,
  replacer,
  valuesOrEmptyArray,
} from "app/state/reducers";

export function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [matrixRoomIds, setMatrixRoomIds] = useState<MatrixRoomList>(new Set());
  const [rooms, setRooms] = useState<Map<string, MatrixRoom>>(new Map()); //
  const [events, setEvents] = useState<Map<MatrixEventID, MatrixCalendarEvent>>(
    new Map()
  );

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          "space-mono": require("app/assets/fonts/SpaceMono-Regular.ttf"),
          "work-sans": require("app/assets/fonts/worksans/WorkSans-Regular.ttf"),
          "work-sans-bold": require("app/assets/fonts/worksans/WorkSans-Bold.ttf"),
          "work-sans-semibold": require("app/assets/fonts/worksans/WorkSans-SemiBold.ttf"),
          "work-sans-medium": require("app/assets/fonts/worksans/WorkSans-Medium.ttf"),
          "work-sans-light": require("app/assets/fonts/worksans/WorkSans-Light.ttf"),
          "work-sans-thin": require("app/assets/fonts/worksans/WorkSans-Thin.ttf"),
          "work-sans-italic": require("app/assets/fonts/worksans/WorkSans-Italic.ttf"),
        });

        const parsedMatrixRooms = await getAsyncStorage("matrixRoomIds");

        if (!parsedMatrixRooms) return;

        setMatrixRoomIds(new Set(parsedMatrixRooms));

        parsedMatrixRooms.forEach(async (roomId: string) => {
          const parsedMatrixRoom = await getAsyncStorage(roomId);
          console.log(
            `parsedMatrixRoom: ${JSON.stringify(parsedMatrixRoom, replacer)}`
          );

          if (!parsedMatrixRoom || !("events" in parsedMatrixRoom)) return;

          const getStoredEvents = async () =>
            Promise.all(
              valuesOrEmptyArray(parsedMatrixRoom.events).map(async eventId => {
                const event = await getAsyncStorage(eventId);
                if (!event) throw new Error("Event not found");
                return event as MatrixCalendarEvent;
              })
            );
          const storedEvents: [string, MatrixCalendarEvent][] = (
            await getStoredEvents()
          ).map(event => [event.eventId, event]);
          console.log(storedEvents);
          const eventsMap = new Map(storedEvents);

          console.log("eventsMap", eventsMap);
          console.log("new map", new Map([...events, ...eventsMap]));

          setEvents(prevEvents => new Map([...prevEvents, ...eventsMap]));
          setRooms(prevRooms =>
            new Map(prevRooms).set(roomId, parsedMatrixRoom)
          );
          setLoadingComplete(true);
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        // setLoadingComplete(true);
        // SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return { isLoadingComplete, matrixRoomIds, events, rooms };
}
