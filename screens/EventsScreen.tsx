import { FlatList, Pressable, StyleSheet, Button } from "react-native";
import { Text, View } from "../components/Themed";
import { MatrixCalendarEvent, RootStackScreenProps } from "../types";
// import { IcalEvent, dateSort } from "../lib/ical";
import ListEvent from "../components/ListEvent";
import { TreeType } from "icalts/dist/src/types";
import { useStateValue } from "../state/context";
import useMatrixClient from "../hooks/useMatrixClient";
import { useEffect, useState } from "react";
// import { useRetry } from "../lib/useRetry";
import { Drawer } from "react-native-drawer-layout";
import CalendarsScreen from "./CalendarsScreen";
import { FontAwesome } from "@expo/vector-icons";

// general goal: display a list of events that combines ical feeds and matrix rooms
// matrix rooms represent the equivalent of calendars: event data may be stored
// in event-type messages in the room, and the room name may be used as the
// calendar name.

// only certain rooms should be included as 'calendar rooms' - this should be
// configurable by the user.  The user should be able to add and remove rooms
// from the list of calendar rooms.

export default function EventsScreen({
  route,
  navigation,
}: RootStackScreenProps<"Root">) {
  const [{ calendars, events }] = useStateValue();
  const { drawerIsOpen } = route.params;
  const { client } = useMatrixClient();

  const Item = ({ calEvent }: { calEvent: MatrixCalendarEvent }) => (
    <Pressable
      onPress={() =>
        navigation.navigate("Event", {
          eventId: calEvent.eventId,
          eventName: calEvent.name,
        })
      }>
      <ListEvent calEvent={calEvent} />
    </Pressable>
  );

  return (
    <Drawer
      open={drawerIsOpen}
      onOpen={() => {
        // navigation.setParams({ drawerIsOpen: true });
      }}
      onClose={() => {
        // navigation.setParams({ drawerIsOpen: false });
      }}
      drawerType="front"
      renderDrawerContent={() => <CalendarsScreen />}>
      <FlatList
        data={[...events.values()].sort((a, b) =>
          a.date.getTime() > b.date.getTime() ? 1 : -1
        )}
        renderItem={calEvent => <Item calEvent={calEvent.item} />}
        keyExtractor={item => item.eventId}
      />
      <View style={styles.fab}>
        <Pressable
          onPress={() => navigation.navigate("CreateEvent")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
          })}>
          <FontAwesome size={30} name="plus" color="white" />
        </Pressable>
      </View>
    </Drawer>
  );

  // TODO: Split sorted list into Past and Future Events
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // overflow: "scroll",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 0,
    borderRadius: 20,
    margin: 16,
    backgroundColor: "#3F51B5",
    padding: 20,
  },
});
