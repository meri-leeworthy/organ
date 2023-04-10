import { StatusBar } from "expo-status-bar";
import { Button, Platform, StyleSheet } from "react-native";
import { Text, TextInput, View } from "../components/Themed";
import { useState, useEffect, useMemo } from "react";
import * as sdk from "matrix-js-sdk";

global.fetch = fetch;

export default function LoginScreen() {
  const [homeserver, setHomeserver] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const client = useMemo(
    () =>
      sdk.createClient({
        baseUrl: "https://matrix.org",
        // fetchFn: (req, args) => {
        //   const url =
        //     typeof req === "string" ? req : "url" in req ? req.url : req.href;
        //   const noqueries = url.split("?")[0];
        //   return fetch(noqueries, args);
        // },
      }),
    []
  );

  client.on(
    // @ts-ignore
    "Room.timeline",
    function (event: any, room: any, toStartOfTimeline: any) {
      if (toStartOfTimeline) {
        return; // don't print paginated results
      }
      if (event.getType() !== "m.room.message") {
        return; // only print messages
      }
      console.log(
        // the room name will update with m.room.name events automatically
        "(%s) %s :: %s",
        room.name,
        event.getSender(),
        event.getContent().body
      );
    }
  );

  client.startClient();

  const handleLogin = async () => {
    // const response = await client.whoami();
    client
      .login("m.login.password", {
        user: username,
        password: password,
        refresh_token: true,
      })
      .then(response => {
        console.log(response);
      });
    // console.log(response);
    // client.loginFlows().then(response => {
    //   console.log(response);
    // });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with Matrix</Text>
      <Text style={styles.label}>Homeserver</Text>
      <TextInput
        onChangeText={setHomeserver}
        value={homeserver}
        placeholder="https://matrix.org - can't be changed yet"
      />
      <Text style={styles.label}>Matrix ID</Text>
      <TextInput
        onChangeText={setUsername}
        value={username}
        placeholder="@username"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        onChangeText={setPassword}
        value={password}
        placeholder="********"
      />
      <Button title="Login" onPress={handleLogin} />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    marginTop: 12,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
