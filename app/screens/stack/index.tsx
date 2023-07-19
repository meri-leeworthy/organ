import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList, RootStackScreenProps } from "app/types";
import { RootDrawer } from "../drawer";
import NotFoundScreen from "./NotFoundScreen";
import LoginScreen from "./LoginScreen";
import CreateEventScreen from "./CreateEventScreen";
import EventScreen from "./EventScreen";
import ChooseHostScreen from "./ChooseHostScreen";
import useMatrixClient from "app/hooks/useMatrixClient";
import { SignUpScreen } from "./SignUpScreen";
import { PasswordResetScreen } from "./PasswordResetScreen";
import { EditFollowsScreen } from "./EditFollowsScreen";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO: Authentication conditional routing

export function RootNavigator() {
  const { client, setRefresh } = useMatrixClient();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefresh(true);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator>
      {client?.isLoggedIn() ? (
        <>
          <Stack.Screen
            name="Drawer"
            component={RootDrawer}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ title: "Oops!" }}
          />
          <Stack.Screen
            name="Event"
            component={EventScreen}
            options={({ route }) => ({ title: route.params.eventName })}
          />
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen
              name="ChooseHost"
              component={ChooseHostScreen}
              options={{
                headerTitle: "Share event to...",
                headerTitleAlign: "left",
                headerLargeTitle: true,
              }}
            />
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{
                headerTitle: "New Event",
                headerTitleAlign: "left",
                headerLargeTitle: true,
              }}
            />
            <Stack.Screen
              name="EditFollows"
              component={EditFollowsScreen}
              options={{
                headerTitle: "Edit Follows",
              }}
            />
          </Stack.Group>
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ title: "Sign Up" }}
          />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
