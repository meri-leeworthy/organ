/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from "@expo/vector-icons";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName, Pressable } from "react-native";
import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import LoginScreen from "../screens/LoginScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import EventsScreen from "../screens/EventsScreen";
import {
  MatrixRoomList,
  RootStackParamList,
  RootStackScreenProps,
} from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import EventScreen from "../screens/EventScreen";
import { StateProvider } from "../state/context";
import { reducer } from "../state/reducers";
// import { parsedIcal } from "../state/fileSample";
import CreateEventScreen from "../screens/CreateEventScreen";

// console.log(parsedIcal);

export default function Navigation({
  matrixRooms,
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
  matrixRooms: MatrixRoomList;
}) {
  console.log("nav index matrixRooms: ", matrixRooms);
  return (
    <StateProvider
      reducer={reducer}
      initialState={{
        calendars: new Map(),
        client: undefined,
        matrixRooms,
        events: new Map(),
      }}>
      <NavigationContainer
        // linking={LinkingConfiguration}
        theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </NavigationContainer>
    </StateProvider>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const colorScheme = useColorScheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={EventsScreen}
        initialParams={{ drawerIsOpen: false }}
        options={({ navigation, route }: RootStackScreenProps<"Root">) => ({
          title: "My Events",
          headerLeft: () => (
            <Pressable
              onPress={() =>
                navigation.setParams({
                  drawerIsOpen: !route.params.drawerIsOpen,
                })
              }
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
              })}>
              <FontAwesome
                name="bars"
                size={25}
                color={Colors[colorScheme].text}
                style={{ marginLeft: 15 }}
              />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
              })}>
              <FontAwesome
                name="user-circle"
                size={25}
                color={Colors[colorScheme].text}
                style={{ marginRight: 15 }}
              />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ headerTitle: "Create New Event" }}
        />
      </Stack.Group>
      <Stack.Screen
        name="Event"
        component={EventScreen}
        options={({ route }) => ({ title: route.params.eventName })}
      />
    </Stack.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
