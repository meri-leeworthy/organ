import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "app/components/Themed";
import { RootDrawerParamList, RootDrawerScreenProps } from "app/types";

export function SettingsScreen({
  navigation,
}: RootDrawerScreenProps<keyof RootDrawerParamList>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        This screen doesn't exist yet. This page is for app settings, like for
        notifications.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={styles.link}>
        <Text style={styles.linkText}>Go to home screen!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
