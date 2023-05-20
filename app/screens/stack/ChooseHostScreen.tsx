import { Button, LinkButton, Text, View } from "app/components/Themed";
import useMatrixClient from "app/hooks/useMatrixClient";
import { RootStackParamList, RootStackScreenProps } from "app/types";
import { StyleSheet } from "react-native";

export default function ChooseHostScreen({
  navigation,
}: RootStackScreenProps<keyof RootStackParamList>) {
  const { client } = useMatrixClient();
  return (
    <View style={styles.container}>
      <Button
        onPress={null}
        text={`${client?.getUserIdLocalpart()}'s Calendar`}
        variant="secondary"
      />
      <LinkButton
        onPress={() => navigation.navigate("Drawer")}
        text="Edit my calendar settings"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingTop: 124,
    flex: 1,
    alignItems: "center",
  },
});
