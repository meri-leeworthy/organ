import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "app/components/Themed";
import { RootDrawerParamList, RootDrawerScreenProps } from "app/types";

export function HomeScreen({
  navigation,
}: RootDrawerScreenProps<keyof RootDrawerParamList>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        This screen doesn't exist yet. Home is a mix of other pages in the
        drawer navigator such as 'following', 'calendar', 'explore', and
        'hosting'. It lets the user scroll and see previews of each page and
        click on them to go to the full page.
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
