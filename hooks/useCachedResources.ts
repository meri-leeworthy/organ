import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { MatrixRoomList } from "../types";
import { getAsyncStorage } from "../state/reducers";

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [matrixRooms, setMatrixRooms] = useState<MatrixRoomList>(new Set());

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

        if (!Array.isArray(parsedMatrixRooms))
          throw new Error("Retrieved data is not an array");
        if (
          parsedMatrixRooms.some(
            (room: unknown) =>
              !room ||
              typeof room !== "object" ||
              !("roomId" in room) ||
              !("roomName" in room)
          )
        )
          throw new Error("Retrieved data is not MatrixRoomList");

        setMatrixRooms(new Set(parsedMatrixRooms));
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

  return { isLoadingComplete, matrixRooms };
}
