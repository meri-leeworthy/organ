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
import Colors from "app/constants/Colors";
import useColorScheme from "app/hooks/useColorScheme";
import LoginScreen from "app/screens/LoginScreen";
import NotFoundScreen from "app/screens/NotFoundScreen";
import { RootStackParamList, RootStackScreenProps } from "types";
import LinkingConfiguration from "./LinkingConfiguration";
import EventScreen from "app/screens/EventScreen";
// import { parsedIcal } from "app/state/fileSample";
import CreateEventScreen from "app/screens/CreateEventScreen";
import { useStateValue } from "app/state/context";
import { View } from "app/components/Themed";
import { RootDrawer } from "app/screens/drawer";

// console.log(parsedIcal);

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      // linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [{ client }] = useStateValue();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Drawer"
        component={RootDrawer}
        // initialParams={{ drawerIsOpen: false }}
        options={({ navigation, route }: RootStackScreenProps<"Drawer">) => ({
          headerShown: false,
          // headerLeft: () => (
          //   <Pressable
          //     onPress={() =>
          //       navigation.setParams({
          //         drawerIsOpen: !route.params.drawerIsOpen,
          //       })
          //     }
          //     style={({ pressed }) => ({
          //       opacity: pressed ? 0.5 : 1,
          //     })}>
          //     <FontAwesome
          //       name="bars"
          //       size={25}
          //       color={Colors[colorScheme].text}
          //       style={{ marginLeft: 15 }}
          //     />
          //   </Pressable>
          // ),
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            color: Colors[colorScheme].text,
            fontFamily: "work-sans-semibold",
          },
          headerTitleStyle: {
            color: Colors[colorScheme].text,
            fontFamily: "work-sans-semibold",
          },
          headerTitleAlign: "left",
          headerRight: () => (
            <View
              style={{
                // flexGrow: 1,
                // borderWidth: 1,
                // flexWrap: "nowrap",
                width: 60,
                // height: "100%",
                // alignItems: "flex-end",
                // justifyContent: "center",
                flexDirection: "row",
              }}>
              <Pressable
                onPress={() => navigation.navigate("CreateEvent")}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  marginRight: 15,
                })}>
                <FontAwesome size={25} name="plus" />
              </Pressable>
              <Pressable
                onPress={() =>
                  navigation.navigate("Account", {
                    isAuthenticated: client?.isLoggedIn() || false,
                  })
                }
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                })}>
                <FontAwesome
                  name="user-circle"
                  size={25}
                  color={Colors[colorScheme].text}
                  style={{}}
                />
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen
          name="Account"
          component={LoginScreen}
          options={({
            navigation,
            route,
          }: RootStackScreenProps<"Account">) => ({
            title: route.params.isAuthenticated ? "My Calendars" : "Login",
          })}
        />
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
