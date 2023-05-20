import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList, RootStackScreenProps } from "app/types";
import { useColorScheme } from "app/hooks/useColorScheme";
import { useStateValue } from "app/state/context";
import { RootDrawer } from "../drawer";
import Colors from "app/constants/Colors";
import { View } from "app/components/Themed";
import { Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import NotFoundScreen from "./NotFoundScreen";
import LoginScreen from "./LoginScreen";
import CreateEventScreen from "./CreateEventScreen";
import EventScreen from "./EventScreen";
import ChooseHostScreen from "./ChooseHostScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
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
          // headerLargeTitle: true,
          // headerLargeTitleStyle: {
          //   color: Colors[colorScheme].text,
          //   fontFamily: "work-sans-semibold",
          // },
          // headerTitleStyle: {
          //   color: Colors[colorScheme].text,
          //   fontFamily: "work-sans-semibold",
          // },
          // headerTitleAlign: "left",
          // headerRight: () => (
          //   <View
          //     style={{
          //       // flexGrow: 1,
          //       // borderWidth: 1,
          //       // flexWrap: "nowrap",
          //       width: 60,
          //       // height: "100%",
          //       // alignItems: "flex-end",
          //       // justifyContent: "center",
          //       flexDirection: "row",
          //     }}>
          //     <Pressable
          //       onPress={() => navigation.navigate("CreateEvent")}
          //       style={({ pressed }) => ({
          //         opacity: pressed ? 0.5 : 1,
          //         marginRight: 15,
          //       })}>
          //       <FontAwesome size={25} name="plus" />
          //     </Pressable>
          //     <Pressable
          //       onPress={() =>
          //         navigation.navigate("Login", {
          //           isAuthenticated: client?.isLoggedIn() || false,
          //         })
          //       }
          //       style={({ pressed }) => ({
          //         opacity: pressed ? 0.5 : 1,
          //       })}>
          //       <FontAwesome
          //         name="user-circle"
          //         size={25}
          //         color={Colors[colorScheme].text}
          //         style={{}}
          //       />
          //     </Pressable>
          //   </View>
          // ),
        })}
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
          name="Login"
          component={LoginScreen}
          options={({ navigation, route }: RootStackScreenProps<"Login">) => ({
            title: route.params.isAuthenticated ? "My Calendars" : "Login",
          })}
        />
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
      </Stack.Group>
    </Stack.Navigator>
  );
}
