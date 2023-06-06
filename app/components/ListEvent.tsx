import { StyleSheet } from "react-native";
import { Text, View } from "../components/Themed";
import { MatrixCalendarEvent } from "app/types";

export default function ListEvent({
  calEvent,
  calendarName,
}: {
  calEvent: MatrixCalendarEvent;
  calendarName: string | undefined;
}) {
  return (
    <View style={styles.event}>
      {calendarName && <Text style={styles.calendarName}>{calendarName}</Text>}
      <View style={styles.titleContainer}>
        <Text style={styles.eventTime}>
          {calEvent.date.toLocaleTimeString().slice(0, -3)}
        </Text>
        <Text style={styles.eventName}>{calEvent.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  event: {
    // flex: 1,
    display: "flex",
    // height: 90,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 10,
    // borderStyle: "solid",
    // borderColor: "#aaaaaa",
    // borderWidth: 1,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },
  titleContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
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
  calendarName: {
    fontSize: 16,
    fontFamily: "work-sans",
    marginBottom: 5,
    color: "#6C4AB6",
  },
});
