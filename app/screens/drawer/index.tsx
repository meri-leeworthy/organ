import {
  DrawerToggleButton,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import Colors from "app/constants/Colors";
import { useColorScheme } from "app/hooks/useColorScheme";
import { RootDrawerParamList } from "app/types";

import { HomeScreen } from "./HomeScreen";
import { CalendarScreen } from "./CalendarScreen";
import { HostingScreen } from "./HostingScreen";
import { FollowingScreen } from "app/screens/drawer/FollowingScreen";
import { ExploreScreen } from "./ExploreScreen";
import { AccountScreen } from "./AccountScreen";
import { SettingsScreen } from "./SettingsScreen";
import { Text, View } from "app/components/Themed";
import { StyleSheet } from "react-native";

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export function RootDrawer() {
  const colorScheme = useColorScheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerPosition: "right",
        headerLeft: () => null,
        headerTitleAlign: "left",
        headerTitleStyle: {
          color: Colors[colorScheme].text,
          fontFamily: "work-sans-semibold",
          fontSize: 30,
        },
        headerRight: DrawerToggleButton,
      }}>
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Organ" }}
      />
      <Drawer.Screen name="Calendar" component={CalendarScreen} />
      <Drawer.Screen name="Hosting" component={HostingScreen} />
      <Drawer.Screen
        name="Following"
        component={FollowingScreen}
        options={{
          headerRight: () => (
            <View style={styles.headerButtonContainer}>
              <Text>Hi</Text>
              <DrawerToggleButton />
            </View>
          ),
        }}
      />
      <Drawer.Screen name="Explore" component={ExploreScreen} />
      <Drawer.Screen name="Account" component={AccountScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    flexDirection: "row",
  },
});
