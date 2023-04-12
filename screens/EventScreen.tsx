import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text } from "../components/Themed";
import { RootStackParamList } from "../types";
import { useStateValue } from "../state/context";
import { IcalEvent, parseDate, printDate } from "../lib/ical";

type Props = NativeStackScreenProps<RootStackParamList, "Event">;

export default function EventScreen(props: Props) {
  const [{ calendars }, dispatch] = useStateValue();
  const cal = calendars[0].calendar;

  if (!("VEVENT" in cal) || !Array.isArray(cal.VEVENT))
    throw new Error("Event Not Found");

  const icalEvent = cal.VEVENT.find(
    vevent => "UID" in vevent && vevent.UID === props.route.params.uid
  ) as IcalEvent;

  return (
    <View>
      <Text>{icalEvent.SUMMARY}</Text>
      <Text>Starts: {printDate(parseDate(icalEvent.DTSTART))}</Text>
      {icalEvent.DTEND && <Text>{printDate(parseDate(icalEvent.DTEND))}</Text>}
    </View>
  );
}
