import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text } from "../components/Themed";
import { RootStackParamList } from "../types";
import { useStateValue } from "../state/context";

type Props = NativeStackScreenProps<RootStackParamList, "Event">;

export default function EventScreen(props: Props) {
  const [{ calendars }, dispatch] = useStateValue();
  const cal = calendars[0];
  return (
    <View>
      <Text>{props.route.params.eventName}</Text>
    </View>
  );
}
