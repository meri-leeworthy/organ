import { FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "../components/Themed";
import { RootTabScreenProps } from "../types";
import { IcalEvent, dateSort } from "../lib/ical";
import ListEvent from "../components/ListEvent";
import { TreeType } from "icalts/dist/src/types";
import { useStateValue } from "../state/context";
import useMatrixClient from "../lib/useMatrixClient";
import { useEffect, useState } from "react";
import { useRetry } from "../lib/useRetry";

// general goal: display a list of events that combines ical feeds and matrix rooms
// matrix rooms represent the equivalent of calendars: event data may be stored
// in event-type messages in the room, and the room name may be used as the
// calendar name.

// only certain rooms should be included as 'calendar rooms' - this should be
// configurable by the user.  The user should be able to add and remove rooms
// from the list of calendar rooms.

export default function EventsScreen({
  navigation,
}: RootTabScreenProps<"Events">) {
  const [{ calendars }, dispatch] = useStateValue();
  const { client, setClient } = useMatrixClient();
  const attemptCount = useRetry(6);

  useEffect(() => {
    if (!client) return;
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("EventsScreen was focused");
    });

    if (!client.isLoggedIn()) return;

    console.log(`Logged in as ${client.getUserId()}`);

    client.on(
      // @ts-ignore
      "Room.timeline",
      function (event: any, room: any, toStartOfTimeline: any) {
        if (toStartOfTimeline) {
          return; // don't print paginated results
        }
        if (event.getType() !== "m.room.message") {
          return; // only print messages
        }
        console.log(
          // the room name will update with m.room.name events automatically
          "(%s) %s :: %s",
          room.name,
          event.getSender(),
          event.getContent().body
        );
      }
    );

    client.startClient();

    return () => {
      client.stopClient();
      unsubscribe();
    };
  }, [navigation, client]);

  useEffect(() => {
    client?.getRooms().forEach(room => {
      console.log(room.name, room.roomId);
      dispatch({
        type: "ADD_ICALENDAR",
        url: room.roomId,
        calendar: {},
      });
    });
  }, [attemptCount]);

  const cal = calendars[0].calendar; //TODO: merge all calendars

  const Item = (vevent: TreeType) => (
    <Pressable
      onPress={() =>
        navigation.navigate("Event", {
          eventName: (vevent as IcalEvent).SUMMARY,
          uid: (vevent as IcalEvent).UID,
        })
      }>
      <ListEvent vevent={vevent as IcalEvent} />
    </Pressable>
  );

  return "VEVENT" in cal && Array.isArray(cal.VEVENT) ? (
    <FlatList
      data={cal.VEVENT.sort((a, b) =>
        dateSort((a as IcalEvent).DTSTART, (b as IcalEvent).DTSTART)
      )}
      renderItem={vevent => <Item {...vevent.item} />}
      keyExtractor={item => (item as IcalEvent).UID}
    />
  ) : (
    <Text>No Events Found</Text>
  );

  // TODO: Split sorted list into Past and Future Events
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // overflow: "scroll",
  },
});
