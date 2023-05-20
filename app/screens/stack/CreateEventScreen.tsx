import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Button,
  HorizontalRule,
  Text,
  TextInput as ThemedTextInput,
  View,
} from "app/components/Themed";
import { useState } from "react";
import useMatrixClient from "app/hooks/useMatrixClient";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useStateValue } from "app/state/context";
import { DismissKeyboard } from "app/components/DismissKeyboard";
import { FontAwesome as FA } from "@expo/vector-icons";
// import { Preset, Visibility } from "matrix-js-sdk";

export default function CreateEventScreen() {
  const [{ calendars }] = useStateValue();
  // const [selectedCalendar, setSelectedCalendar] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const { client } = useMatrixClient();
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date(Date.now()));
  const myHeaderHeight = useHeaderHeight();

  // const matrixCalendars = calendars.values();
  const onChange = (
    _event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    if (selectedDate === undefined) return;
    const currentDate = selectedDate;
    setDate(currentDate);
  };

  if (!client) return <Text>loading...</Text>;

  const handleCreateEvent = async () => {
    const newEvent = {
      name: eventName,
      venue,
      description,
      date,
    };

    console.log(newEvent);

    //this should perhaps come at a later step in the flow
    // await client.sendEvent(
    //   selectedCalendar,
    //   "directory.radical.event.v0.1",
    //   newEvent,
    //   "",
    //   (err, res) => {
    //     console.log(err);
    //   }
    // );
    // navigation.goBack();
  };

  return (
    <DismissKeyboard>
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        keyboardVerticalOffset={myHeaderHeight + 47}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* <Text style={styles.label}>Choose Calendar</Text>
          <RNPickerSelect
            value={selectedCalendar}
            onValueChange={itemValue => setSelectedCalendar(itemValue)}
            items={[...matrixCalendars].map(c => {
              return { label: c.roomName, value: c.roomId };
            })}
            style={{ viewContainer: styles.select }}
          /> */}
          {/* <Text style={styles.label}>Event Name</Text> */}
          <ThemedTextInput
            onChangeText={setEventName}
            value={eventName}
            placeholder="Your event's name..."
            style={styles.titleInput}
          />
          {/* <Text style={styles.label}>Date</Text> */}
          <DateTimePickerSet onChange={onChange} date={date} />
          <View style={styles.datetimecontainer}>
            <FontAwesome name="location-arrow" />
            {/* <Text style={styles.label}>Venue</Text> */}
            <ThemedTextInput
              onChangeText={setVenue}
              value={venue}
              placeholder="Meeting place..."
              style={{ marginLeft: 20 }}
            />
          </View>

          {/* <Text style={styles.label}>Description</Text> */}

          <View style={styles.datetimecontainer}>
            <FontAwesome name="pencil" />
            <ThemedTextInput
              onChangeText={setDescription}
              value={description}
              multiline
              numberOfLines={4}
              style={{ height: 100, marginLeft: 16 }}
              placeholder="Description of your event"
            />
          </View>
          {/* <View style={{ flex: 1 }} /> */}

          <Button onPress={handleCreateEvent} text="continue" />

          {/* Use a light status bar on iOS to account for the black space above the modal */}
          <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
          <View style={{ flex: 1 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboard>
  );
}

const DateTimePickerSet = ({
  onChange,
  date,
}: {
  onChange: (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => void;
  date: Date;
}) => {
  return (
    <View style={styles.datetimecontainer}>
      <FontAwesome name="calendar" />
      <DateTimePicker
        testID="dateTimePicker"
        value={date}
        mode="date"
        is24Hour={true}
        onChange={onChange}
        style={styles.datetimepicker}
      />
      <DateTimePicker
        testID="dateTimePicker"
        value={date}
        mode="time"
        is24Hour={true}
        onChange={onChange}
        style={styles.datetimepicker}
      />
    </View>
  );
};

const FontAwesome = ({ name }: { name: keyof typeof FA.glyphMap }) => (
  <FA name={name} size={24} color="#999" style={styles.fa} />
);

const styles = StyleSheet.create({
  select: {
    height: 40,
    borderColor: "orange",
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
    borderWidth: 1,
  },
  datetimecontainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    // alignItems: "",
    marginTop: 32,
    backgroundColor: "transparent",
  },
  datetimepicker: {
    marginLeft: 16,
    borderRadius: 4,
  },
  titleInput: {
    fontSize: 30,
    marginTop: 12,
    marginHorizontal: 6,
  },
  container: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    marginTop: 12,
    fontFamily: "work-sans",
  },
  fa: { marginTop: 6 },
  button: {
    backgroundColor: "#8D9EFF",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    height: 48,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontFamily: "work-sans",
  },
});
