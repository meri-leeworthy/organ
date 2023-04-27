import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { MatrixRoomList } from "../types";

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [matrixRooms, setMatrixRooms] = useState<MatrixRoomList>([]);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          "space-mono": require("../assets/fonts/SpaceMono-Regular.ttf"),
        });

        const storedMatrixRooms = await AsyncStorage.getItem("matrixRooms");

        // if (!storedMatrixRooms) throw new Error("no stored matrix rooms");
        if (!storedMatrixRooms) return;

        const parsedMatrixRooms: unknown = await JSON.parse(storedMatrixRooms);

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

        setMatrixRooms(parsedMatrixRooms);
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
