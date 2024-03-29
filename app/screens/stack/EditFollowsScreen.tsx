import { Text, View, TextInput } from "app/components/Themed";
import { StyleSheet, Button, Alert, Pressable } from "react-native";
import { useState } from "react";
import { useStateValue } from "app/state/context";
import { MatrixRoom } from "app/types";

// matches #room:server.tld or !room:server.tld
const MATRIX_FQID = /(\!|#)\w+:[\w.-]+\.\w+$/;

// matches https://matrix.to/#/#room:server.tld or https://matrix.to/#/!room:server.tld
// or #room:server.tld or !room:server.tld and may include query parameters
const MATRIX_CATCHALL =
  /^(https?:\/\/matrix\.to\/#\/)?(\!|#)([a-zA-Z0-9=_\-\/]+):([a-zA-Z0-9._-]+)?(\?.*)?$/;

const URL_SCHEME = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

type UrlType = "none" | "matrix" | "ical";

export function EditFollowsScreen() {
  const [{ calendars, standardRooms }, dispatch] = useStateValue();
  const [url, setUrl] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlType, setUrlType] = useState<UrlType>("none");

  function inputHandler(value: string) {
    setUrl(value);
    if (MATRIX_CATCHALL.test(value)) {
      setUrlType("matrix");
    } else if (URL_SCHEME.test(value)) {
      setUrlType("ical");
    } else {
      setUrlType("none");
    }
  }

  async function addHandler() {
    if (urlType === "none") {
      setError("Invalid URL");
      return;
    }

    // if calendar already exists, don't add it again
    // this doesn't resolve room aliases :/ probs should hey
    if (calendars.has(url)) {
      setError("Calendar already exists");
      return;
    }

    setLoading(true);

    // try to add the calendar...

    // if it's an ical url, we need to fetch the url and add it to the user's list of calendars

    // if (urlType === "ical") {
    //   fetch(url)
    //     .then(response => response.text())
    //     .then(text => {
    //       dispatch({
    //         type: "ADD_ICALENDAR",
    //         url,
    //         name: "My iCal", //TODO: get name from ical
    //         calendar: parseIcal(text)[0],
    //       });
    //       setLoading(false);
    //     })
    //     .catch(error => setError(error));
    // }

    if (urlType === "matrix") {
      // if it's a matrix room that the user is in, we need to add it to the user's list of calendars

      const roomId = url.match(MATRIX_FQID)![0];

      console.log("ROOM ID", roomId);

      const room = calendars.get(roomId);
      console.log("ROOM", room);
      if (room) {
        dispatch({
          type: "SET_MATRIX_CALENDAR",
          roomId,
          roomName: room.roomName,
          events: new Map(),
          roomType: "calendar",
        });
        setLoading(false);
        return;
      } else {
        // if it's a matrix room that the user is not in, we need to try to join the room? or preview it?
        // and also add it to the user's list of calendars
        console.log("TODO: join room");
      }

      setLoading(false);
    }
  }

  const addRoomToCalendarsAlert = (room: MatrixRoom) =>
    Alert.alert(
      "Add Calendar",
      `Do you want to add ${room.roomName} to your calendars?`,
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            console.log("OK Pressed, adding room to calendars");
            dispatch({
              type: "SET_MATRIX_CALENDAR",
              roomId: room.roomId,
              roomName: room.roomName,
              events: new Map(),
              roomType: "calendar", //this despite the room 'type' not having been set? inconsistency hmm
              // the goal UX, i think, is that users can post events in standard non-calendar rooms and treat them
              // as calendars, OR they can create new calendar rooms. The difference is that calendar rooms have
              //
            });
            dispatch({
              type: "DELETE_MATRIX_STANDARD_ROOM",
              roomId: room.roomId,
            });
          },
        },
      ]
    );

  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={inputHandler}
        value={url}
        placeholder="Enter URL"
      />
      {url && <Button title="Add" onPress={addHandler} />}
      {isLoading && <Text>Loading...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      <Text style={styles.heading}>My Calendars</Text>
      {[...calendars.values()].map(calendar => (
        <View key={calendar.roomId} style={styles.calendar}>
          <Text>{calendar.roomName}</Text>
        </View>
      ))}
      <Text style={styles.heading}>My Matrix Rooms</Text>
      {[...standardRooms.values()].map((room, i) => (
        <Pressable key={i} onPress={() => addRoomToCalendarsAlert(room)}>
          <View style={styles.calendar}>
            <Text>{room.roomName}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  heading: {
    fontWeight: "bold",
    fontsize: 20,
    marginTop: 16,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  calendar: {
    borderWidth: 1,
    borderColor: "black",
    padding: 12,
    marginTop: 12,
    borderRadius: 4,
  },
});
