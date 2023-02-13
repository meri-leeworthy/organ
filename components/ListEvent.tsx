import { StyleSheet } from "react-native";
import { Text, View } from "../components/Themed";
import { parseIcal, parseDate, IcalEvent } from "../lib/parseIcal";
import dayjs from "dayjs";

export default function ListEvent({ vevent }: { vevent: IcalEvent }) {
  const dtStart = parseDate(vevent.DTSTART);
  // const dtEnd = parseDate(vevent.DTEND);
  // "DTEND" in vevent ? dayjs(vevent.DTEND, gCalDateFormat) : undefined;
  return (
    <View style={styles.event}>
      <Text>{vevent.SUMMARY}</Text>
      <Text>
        {dtStart.type === "DATETIME"
          ? dtStart.value.format("HH:mm, DD MMMM YYYY")
          : dtStart.value.format("DD MMMM YYYY")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  event: {
    // flex: 1,
    display: "flex",
    height: 90,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 10,
    borderStyle: "solid",
    borderColor: "#aaaaaa",
    borderWidth: 1,
    margin: 10,
    borderRadius: 10,
  },
});
