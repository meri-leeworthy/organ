import { StyleSheet } from "react-native";
import { LinkButton, Text, View } from "app/components/Themed";
import { RootDrawerParamList, RootDrawerScreenProps } from "app/types";

export function HostingScreen({
  navigation,
}: RootDrawerScreenProps<keyof RootDrawerParamList>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        This screen doesn't exist yet. Hosting is for events which the user is
        'hosting' or 'co-hosting'. Ultimately it should be possible for a single
        user to act as multiple hosts which are like groups.
      </Text>
      <LinkButton
        onPress={() => navigation.navigate("Home")}
        text="Go to home screen!"
      />
      <LinkButton
        onPress={() => navigation.getParent()?.navigate("ChooseHost")}
        text="Create New Event"
      />
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
});
