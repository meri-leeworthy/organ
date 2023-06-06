import { Pressable, StyleSheet } from "react-native";
import { Text, View } from "app/components/Themed";
import { MatrixCalendarEvent, RootDrawerScreenProps } from "../../types";
// import { IcalEvent, dateSort } from "../lib/ical";
import ListEvent from "app/components/ListEvent";
// import { TreeType } from "icalts/dist/src/types";
import { useStateValue } from "app/state/context";
import useMatrixClient from "app/hooks/useMatrixClient";
// import { useRetry } from "app/lib/useRetry";
import { FlashList } from "@shopify/flash-list";
import { useEffect } from "react";
import { DrawerToggleButton } from "@react-navigation/drawer";

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
  const [{ events, calendars }] = useStateValue();
  // const { drawerIsOpen } = route.params;
  useMatrixClient();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtonContainer}>
          <Pressable
            onPress={() => navigation.getParent()?.navigate("EditFollows")}>
            <Text>Hi</Text>
          </Pressable>
          <DrawerToggleButton />
        </View>
      ),
    });
  }, [navigation]);

  console.log(events);

  const Item = ({
    calEvent,
    calendarName,
  }: {
    calEvent: MatrixCalendarEvent;
    calendarName: string | undefined;
  }) => (
    <Pressable
      onPress={() =>
        navigation.getParent()?.navigate("Event", {
          eventId: calEvent.eventId,
          eventName: calEvent.name,
        })
      }>
      <ListEvent calEvent={calEvent} calendarName={calendarName} />
    </Pressable>
  );

  const data = [...events.values()].sort((a, b) =>
    a.date.getTime() > b.date.getTime() ? 1 : -1
  );

  return (
    <FlashList
      data={insertSectionHeaders(data)}
      renderItem={({ item }) => {
        if (typeof item === "string")
          return <Text style={styles.sectionHeader}>{item}</Text>;
        else
          return (
            <Item
              calEvent={item}
              calendarName={calendars.get(item.calendarId)?.roomName}
            />
          );
      }}
      getItemType={item => {
        return typeof item === "string" ? "sectionHeader" : "row";
      }}
      keyExtractor={item => (typeof item === "string" ? item : item.eventId)}
      estimatedItemSize={100}
    />
  );

  // TODO: Split sorted list into Past and Future Events
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingLeft: 10,
    paddingTop: 16,
    fontSize: 16,
    color: "#333333",
    fontFamily: "work-sans-semibold",
  },
  headerButtonContainer: {
    flexDirection: "row",
  },
});

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
