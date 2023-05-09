import { StatusBar } from "expo-status-bar";
import { Button, Platform, StyleSheet } from "react-native";
import { Text, TextInput, View } from "../components/Themed";
import { useEffect, useState } from "react";
import useMatrixClient from "../hooks/useMatrixClient";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [homeserver, setHomeserver] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { client, setClient } = useMatrixClient();
  const navigation = useNavigation();

  if (!client) return <Text>loading...</Text>;

  const handleLogin = async () => {
    const loginflows = await client.loginFlows();
    console.log(loginflows);

    try {
      const response = await client.login("m.login.password", {
        user: username,
        password: password,
        // refresh_token: true,
      });
      console.log(response);

      await SecureStore.setItemAsync("accessToken", response.access_token);
      console.log("access token saved");

      // await SecureStore.setItemAsync("refreshToken", response.refresh_token);
      // console.log("refresh token saved");

      setClient(client);
      navigation.goBack();
    } catch (error) {
      console.error("login didn't work!", error);
    }
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
        secureTextEntry={true}
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
