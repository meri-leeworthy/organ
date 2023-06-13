import { FontAwesome } from "@expo/vector-icons";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

export function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

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
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        // SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return { isLoadingComplete };
}
