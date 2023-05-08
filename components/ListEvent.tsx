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
      <Text style={styles.eventTime}>
        {calEvent.date.toLocaleTimeString().slice(0, -3)}
      </Text>
      <Text style={styles.eventName}>{calEvent.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  event: {
    // flex: 1,
    display: "flex",
    // height: 90,
    flexDirection: "row",
    alignItems: "flex-end",
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
  eventTime: {
    fontSize: 16,
    fontFamily: "work-sans",
    marginRight: 10,
  },
});
