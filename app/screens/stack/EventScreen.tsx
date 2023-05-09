import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text } from "app/components/Themed";
import { RootStackParamList } from "app/types";
import { useStateValue } from "app/state/context";
import { useEffect } from "react";
import { valuesOrEmptyArray } from "app/state/reducers";

type Props = NativeStackScreenProps<RootStackParamList, "Event">;

export default function EventScreen(props: Props) {
  const [{ events, calendars }, dispatch] = useStateValue();

  const thisEvent = events.get(props.route.params.eventId);

  if (!thisEvent) return <Text>Event not found</Text>;

  const thisCalendar = calendars.get(thisEvent?.calendarId);

  useEffect(() => {
    if (!thisCalendar) return;
    if (
      valuesOrEmptyArray(thisCalendar?.events).some(
        event => event.eventId === thisEvent.eventId
      )
    ) {
      return;
    }
    dispatch({
      type: "ADD_MATRIX_EVENT",
      ...thisEvent,
    });
  }, []);

  return (
    <View>
      <Text>{thisEvent.name}</Text>
      <Text>Starts: {thisEvent.date.toDateString()}</Text>
      <Text>Venue: {thisEvent.venue}</Text>
      <Text>Description: {thisEvent.description}</Text>
      <Text>Calendar: {thisEvent.calendarId}</Text>
    </View>
  );
}
