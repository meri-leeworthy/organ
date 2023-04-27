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
import { Text, TextInput, View } from "../components/Themed";
import { useEffect, useState } from "react";
import useMatrixClient from "../hooks/useMatrixClient";
// import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useStateValue } from "../state/context";
import { MatrixCalendar } from "../types";
import { DismissKeyboard } from "../components/DismissKeyboard";
// import KeyboardManager, {
//   PreviousNextView,
// } from "react-native-keyboard-manager"; // this may not work with expo go as i think it's a native module

export default function CreateEventScreen() {
  const [{ calendars, matrixRooms }, dispatch] = useStateValue();
  console.log("calendars", calendars);
  const matrixCalendars = calendars.filter(
    c => "roomId" in c
  ) as MatrixCalendar[];
  console.log("matrixcals", matrixCalendars);

  const [selectedCalendar, setSelectedCalendar] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const { client, setClient } = useMatrixClient();
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date(Date.now()));
  const myHeaderHeight = useHeaderHeight();
  // const [time, setTime] = useState(new Date(1598051730000));
  // const [mode, setMode] = useState<"date" | "time" | undefined>("date");
  // const [show, setShow] = useState(true);

  const onChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    if (selectedDate === undefined) return;
    const currentDate = selectedDate;
    // setShow(false);
    setDate(currentDate);
  };

  // const showMode = (currentMode: "date" | "time" | undefined) => {
  //   if (Platform.OS === "android") {
  //     setShow(false);
  //     // for iOS, add a button that closes the picker
  //   }
  //   setMode(currentMode);
  // };

  // const showDatepicker = () => {
  //   showMode("date");
  // };

  // const showTimepicker = () => {
  //   showMode("time");
  // };

  const DateTimePickerSet = () => {
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

  // question: if I login on a client then use useMatrixClient to get a client
  // on another screen, will it be logged in?

  if (!client) return <Text>loading...</Text>;

  const handleCreateEvent = async () => {
    const newEvent = {
      name: eventName,
      venue,
      description,
      date,
    };
    console.log("event:", newEvent, selectedCalendar);
    // const content = {
    //   body: "message text",
    //   msgtype: "m.text",
    // };
    client.sendEvent(
      selectedCalendar,
      "directory.radical.event.v1",
      newEvent,
      "",
      (err, res) => {
        console.log(err);
      }
    );
    // try {
    //   const response = await client.login("m.login.password", {
    //     user: username,
    //     password: password,
    //     // refresh_token: true,
    //   });
    //   console.log(response);
    //   await SecureStore.setItemAsync("accessToken", response.access_token);
    //   console.log("access token saved");
    //   // await SecureStore.setItemAsync("refreshToken", response.refresh_token);
    //   // console.log("refresh token saved");
    //   setClient(client);
    //   navigation.goBack();
    // } catch (error) {
    //   console.error("login didn't work!", error);
    // }
  };

  return (
    <DismissKeyboard>
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        keyboardVerticalOffset={myHeaderHeight + 47}
        style={{ flex: 1 }}>
        {/* <PreviousNextView style={{ flex: 1 }}> */}
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Choose Calendar</Text>
          <RNPickerSelect
            value={selectedCalendar}
            onValueChange={itemValue => setSelectedCalendar(itemValue)}
            items={matrixCalendars.map(c => {
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
          <DateTimePickerSet />
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

          {/* <Text>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Modi quasi
          corrupti quas beatae minus aut odit voluptatum, delectus nostrum
          soluta nemo animi dicta repudiandae fuga itaque vitae dignissimos
          voluptatibus minima. Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Rerum magni quam, nulla distinctio reprehenderit,
          eligendi similique libero quasi non fuga laudantium aperiam! Magnam
          sed dolores, delectus quibusdam iusto vel pariatur? Lorem ipsum dolor
          sit amet consectetur adipisicing elit. Fugit soluta, numquam
          voluptatum modi molestias quia! Deleniti excepturi distinctio dicta
          non consequatur, quaerat sint, quisquam possimus sit, dignissimos
          quidem quae fugiat. Lorem ipsum dolor sit amet consectetur,
          adipisicing elit. Natus porro exercitationem, cum laudantium velit
          deleniti enim omnis sint aliquid maiores ex commodi. Impedit molestiae
          alias, nesciunt natus ab repellat id!
        </Text> */}

          {/* Use a light status bar on iOS to account for the black space above the modal */}
          <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
          <View style={{ flex: 1 }} />
        </ScrollView>
        {/* </PreviousNextView> */}
      </KeyboardAvoidingView>
    </DismissKeyboard>
  );
}

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
    // backgroundColor: "#999",
  },
  container: {
    flex: 1,
    // display: "flex",
    height: "100%",
    // overflow: "scroll",
    // alignItems: "stretch",
    justifyContent: "flex-end",
    padding: 12,
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
