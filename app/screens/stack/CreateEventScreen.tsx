import { StatusBar } from "expo-status-bar";
import {
  Button,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Text, TextInput, View } from "../../components/Themed";
import { useState } from "react";
import useMatrixClient from "../../hooks/useMatrixClient";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useStateValue } from "../../state/context";
import { DismissKeyboard } from "../../components/DismissKeyboard";

export default function CreateEventScreen() {
  const [{ calendars }] = useStateValue();
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const { client, setClient } = useMatrixClient();
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date(Date.now()));
  const myHeaderHeight = useHeaderHeight();

  const matrixCalendars = calendars.values();
  const onChange = (
    event: DateTimePickerEvent,
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
    await client.sendEvent(
      selectedCalendar,
      "directory.radical.event.v1",
      newEvent,
      "",
      (err, res) => {
        console.log(err);
      }
    );
    navigation.goBack();
  };

  return (
    <DismissKeyboard>
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        keyboardVerticalOffset={myHeaderHeight + 47}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Choose Calendar</Text>
          <RNPickerSelect
            value={selectedCalendar}
            onValueChange={itemValue => setSelectedCalendar(itemValue)}
            items={[...matrixCalendars].map(c => {
              return { label: c.roomName, value: c.roomId };
            })}
            style={{ viewContainer: styles.select }}
          />
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            onChangeText={setEventName}
            value={eventName}
            placeholder="Name of your event"
          />
          <Text style={styles.label}>Date</Text>
          <DateTimePickerSet onChange={onChange} date={date} />
          <Text style={styles.label}>Venue</Text>
          <TextInput
            onChangeText={setVenue}
            value={venue}
            placeholder="Set the location here"
          />
          <Text style={styles.label}>Description</Text>

          <TextInput
            onChangeText={setDescription}
            value={description}
            multiline
            numberOfLines={4}
            style={{ height: 100 }}
            placeholder="Description of your event"
          />

          <Button title="Create" onPress={handleCreateEvent} />

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
    justifyContent: "center",
    marginTop: 12,
    backgroundColor: "transparent",
  },
  datetimepicker: {
    marginHorizontal: 8,
    borderRadius: 4,
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
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
