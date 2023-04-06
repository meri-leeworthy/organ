import { FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "../components/Themed";
import { RootTabScreenProps } from "../types";
import { IcalEvent, dateSort } from "../lib/ical";
import ListEvent from "../components/ListEvent";
import { TreeType } from "icalts/dist/src/types";
import { useStateValue } from "../state/context";

export default function EventsScreen({
  navigation,
}: RootTabScreenProps<"Events">) {
  const [{ calendars }, dispatch] = useStateValue();
  const cal = calendars[0].calendar; //currently takes TODO: merge all calendars

  const Item = (vevent: TreeType) => (
    <Pressable
      onPress={() =>
        navigation.navigate("Event", {
          eventName: (vevent as IcalEvent).SUMMARY,
          uid: (vevent as IcalEvent).UID,
        })
      }>
      <ListEvent vevent={vevent as IcalEvent} />
    </Pressable>
  );

  return "VEVENT" in cal && Array.isArray(cal.VEVENT) ? (
    <FlatList
      data={cal.VEVENT.sort((a, b) =>
        dateSort((a as IcalEvent).DTSTART, (b as IcalEvent).DTSTART)
      )}
      renderItem={vevent => <Item {...vevent.item} />}
      keyExtractor={item => (item as IcalEvent).UID}
    />
  ) : (
    <Text>No Events Found</Text>
  );

  // TODO: Split sorted list into Past and Future Events
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // overflow: "scroll",
  },
});
