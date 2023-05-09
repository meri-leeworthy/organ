import { FlatList, Pressable, StyleSheet, Button } from "react-native";
import { Text, View } from "../../components/Themed";
import {
  MatrixCalendarEvent,
  RootDrawerScreenProps,
  RootStackScreenProps,
} from "../../../types";
// import { IcalEvent, dateSort } from "../lib/ical";
import ListEvent from "../../components/ListEvent";
import { TreeType } from "icalts/dist/src/types";
import { useStateValue } from "../../state/context";
import useMatrixClient from "../../hooks/useMatrixClient";
import { useEffect, useState } from "react";
// import { useRetry } from "../lib/useRetry";
import { Drawer } from "react-native-drawer-layout";
import { EditFollowsScreen } from "../EditFollowsScreen";
import { FontAwesome } from "@expo/vector-icons";
import { CellContainer, FlashList } from "@shopify/flash-list";

// general goal: display a list of events that combines ical feeds and matrix rooms
// matrix rooms represent the equivalent of calendars: event data may be stored
// in event-type messages in the room, and the room name may be used as the
// calendar name.

// only certain rooms should be included as 'calendar rooms' - this should be
// configurable by the user.  The user should be able to add and remove rooms
// from the list of calendar rooms.

export function FollowingScreen({
  route,
  navigation,
}: RootDrawerScreenProps<"Following">) {
  const [{ events }] = useStateValue();
  // const { drawerIsOpen } = route.params;
  useMatrixClient();

  console.log(events);

  const Item = ({ calEvent }: { calEvent: MatrixCalendarEvent }) => (
    <Pressable
      onPress={() =>
        navigation.getParent()?.navigate("Event", {
          eventId: calEvent.eventId,
          eventName: calEvent.name,
        })
      }>
      <ListEvent calEvent={calEvent} />
    </Pressable>
  );

  const data = [...events.values()].sort((a, b) =>
    a.date.getTime() > b.date.getTime() ? 1 : -1
  );

  // a function that inserts a section header into the list of events
  // when the date of the next event is different from the date of the
  // previous event

  const insertSectionHeaders = (events: MatrixCalendarEvent[]) => {
    const sortedEvents = [...events].sort((a, b) =>
      a.date.getTime() > b.date.getTime() ? 1 : -1
    );
    const result = sortedEvents.reduce((acc, event) => {
      const date = event.date.toDateString();
      if (acc.length === 0 || acc[acc.length - 1] !== date) {
        acc.push(date);
      }
      acc.push(event);
      return acc;
    }, [] as (string | MatrixCalendarEvent)[]);
    return result;
  };

  return (
    // <Drawer
    //   open={drawerIsOpen}
    //   onOpen={() => {
    //     // navigation.setParams({ drawerIsOpen: true });
    //   }}
    //   onClose={() => {
    //     // navigation.setParams({ drawerIsOpen: false });
    //   }}
    //   drawerType="front"
    //   renderDrawerContent={() => <CalendarsScreen />}>
    <FlashList
      data={insertSectionHeaders(data)}
      renderItem={({ item }) => {
        if (typeof item === "string")
          return <Text style={styles.sectionHeader}>{item}</Text>;
        else return <Item calEvent={item} />;
      }}
      getItemType={item => {
        return typeof item === "string" ? "sectionHeader" : "row";
      }}
      keyExtractor={item => (typeof item === "string" ? item : item.eventId)}
      // style={styles.eventsList}
      estimatedItemSize={100}
      // ListHeaderComponent={View}
      // ListHeaderComponentStyle={{ height: 155 }}
    />
    // </Drawer>
  );

  // TODO: Split sorted list into Past and Future Events
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // overflow: "scroll",
  },
  eventsList: {
    backgroundColor: "#fff",
    // paddingTop: 155,
  },
  sectionHeader: {
    paddingLeft: 10,
    paddingTop: 16,
    fontSize: 16,
    color: "#333333",
    fontFamily: "work-sans-semibold",
  },
});
