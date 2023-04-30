import { StyleSheet } from "react-native";
import { Text, View } from "../components/Themed";
import dayjs from "dayjs";
import { MatrixCalendarEvent } from "../types";

export default function ListEvent({
  calEvent,
}: {
  calEvent: MatrixCalendarEvent;
}) {
  return (
    <View style={styles.event}>
      <Text style={styles.eventName}>{calEvent.name}</Text>
      <Text>{calEvent.date.toDateString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  event: {
    // flex: 1,
    display: "flex",
    // height: 90,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 10,
    // borderStyle: "solid",
    // borderColor: "#aaaaaa",
    // borderWidth: 1,
    margin: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  eventName: {
    fontSize: 20,
    fontFamily: "work-sans",
  },
});
