import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text } from "app/components/Themed";
import { RootStackParamList } from "app/types";
import { useStateValue } from "app/state/context";
import { useEffect } from "react";
import { mapEntriesOrEmptyArray } from "app/lib/localStorage";

type Props = NativeStackScreenProps<RootStackParamList, "Event">;

export default function EventScreen(props: Props) {
  const [{ events, calendars }, dispatch] = useStateValue();

  const thisEvent = events.get(props.route.params.eventId);

  if (!thisEvent) return <Text>Event not found</Text>;

  const thisCalendar = calendars.get(thisEvent?.rootEventRoomId);

  useEffect(() => {
    if (!thisCalendar) return;
    if (
      mapEntriesOrEmptyArray(thisCalendar?.events).some(
        event => event[1] === thisEvent.eventId
      )
    ) {
      return;
    }
    dispatch({
      type: "SET_MATRIX_EVENT",
      ...thisEvent,
    });
  }, []);

  return (
    <View>
      <Text>{thisEvent.name}</Text>
      <Text>Starts: {thisEvent.date.toDateString()}</Text>
      <Text>Venue: {thisEvent.venue}</Text>
      <Text>Description: {thisEvent.description}</Text>
      <Text>Calendar: {thisEvent.rootEventRoomId}</Text>
    </View>
  );
}
