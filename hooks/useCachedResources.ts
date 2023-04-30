import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
  MatrixCalendarEvent,
  MatrixEventID,
  MatrixRoom,
  MatrixRoomList,
} from "../types";
import { getAsyncStorage } from "../state/reducers";

export default function useCachedResources() {
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
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          "space-mono": require("../assets/fonts/SpaceMono-Regular.ttf"),
          "work-sans": require("../assets/fonts/worksans/WorkSans-Regular.ttf"),
          "work-sans-bold": require("../assets/fonts/worksans/WorkSans-Bold.ttf"),
          "work-sans-semibold": require("../assets/fonts/worksans/WorkSans-SemiBold.ttf"),
          "work-sans-medium": require("../assets/fonts/worksans/WorkSans-Medium.ttf"),
          "work-sans-light": require("../assets/fonts/worksans/WorkSans-Light.ttf"),
          "work-sans-thin": require("../assets/fonts/worksans/WorkSans-Thin.ttf"),
          "work-sans-italic": require("../assets/fonts/worksans/WorkSans-Italic.ttf"),
        });

        const parsedMatrixRooms = await getAsyncStorage("matrixRooms");

        if (!parsedMatrixRooms) return;

        setMatrixRoomIds(new Set(parsedMatrixRooms));

        // now we want to fetch each room and populate the calendars

        parsedMatrixRooms.forEach(async (roomId: string) => {
          const parsedMatrixRoom = await getAsyncStorage(roomId);
          if (!parsedMatrixRoom || !("events" in parsedMatrixRoom)) return;
          const parsedEvents = async () =>
            Promise.all(
              [...parsedMatrixRoom.events.values()].map(async eventId => {
                const event = await getAsyncStorage(eventId);
                if (!event) throw new Error("Event not found");
                return event as MatrixCalendarEvent;
              })
            );
          const parsedEventsMap = new Map(Object.entries(await parsedEvents()));
          setEvents(prevEvents => new Map([...prevEvents, ...parsedEventsMap]));
          setRooms(prevRooms =>
            new Map(prevRooms).set(roomId, parsedMatrixRoom)
          );
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return { isLoadingComplete, matrixRoomIds, events, rooms };
}
