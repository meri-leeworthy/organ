import * as sdk from "matrix-js-sdk";
import { useStateValue } from "../state/context";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ClientSyncState,
  EventUnstableEventType,
  RoomTypeEventType,
  RootEventIdEventType,
} from "app/types";
// import { useRetry } from "./useRetry";

export default function useMatrixClient() {
  const [{ calendars, events }, dispatch] = useStateValue();
  const [client, setClient] = useState<sdk.MatrixClient | undefined>(undefined);
  const [refresh, setRefresh] = useState(false); //this is to force a rerender when the client changes, because of shallow object equality
  const [clientSyncState, setClientSyncState] = useState<ClientSyncState>(null);
  // const attemptCount = useRetry(3);

  function setClientAndSyncStateCallback(newClient: sdk.MatrixClient) {
    newClient.once(sdk.ClientEvent.Sync, (state: ClientSyncState) =>
      setClientSyncState(state)
    );
    setClient(newClient);
    setRefresh(true);
  }

  useEffect(() => {
    if (!client) return;
    const rooms = client.getRooms();
    const roomIds = new Set(rooms?.map(room => room.roomId));

    if (roomIds && rooms.length > 0) {
      dispatch({ type: "SET_MATRIX_ROOMS", matrixRooms: roomIds });

      rooms.forEach(room => {
        console.log("got room:", room);
        getRoomTypeAndStore(room);
      });
    }

    async function getRoomTypeAndStore(room: sdk.Room) {
      const roomType = await client?.getStateEvent(
        room.roomId,
        RoomTypeEventType.value,
        ""
      );

      console.log("got room type:", roomType);

      if (roomType?.room_type === "calendar") {
        if (calendars.has(room.roomId)) return;

        // set a calendar with no events so they can be added incrementally
        dispatch({
          type: "SET_MATRIX_CALENDAR",
          roomId: room.roomId,
          roomName: room.name,
          roomType: "calendar",
          events: new Map(),
        });
        return;
      }

      if (roomType?.room_type === "event") {
        const rootEventId = await client?.getStateEvent(
          room.roomId,
          RootEventIdEventType.value,
          ""
        );
        console.log("got root event ID:", rootEventId);

        //we need to work out wtf the 'record' getStateEvent is returning
        // if (!rootEventId || !events.has(rootEventId)) {

        // then get the event from the root event room

        // dispatch({
        //   type: "SET_MATRIX_EVENT",
        //   name: room.name,
        //   eventId: undefined,
        //   date: undefined,
        //   description: undefined,
        //   venue: undefined,
        //   rootEventRoomId: undefined,
        //   sharedEventIds: undefined,
        // });
        return;
      }

      dispatch({
        type: "SET_MATRIX_STANDARD_ROOM",
        roomId: room.roomId,
        roomName: room.name,
        roomType: undefined,
      });
    }
  }, [clientSyncState, refresh]);

  useEffect(() => {
    async function setClientWithTokenIfExists() {
      if (!!client && client.isLoggedIn()) return;

      if (!client) {
        const baseClient = sdk.createClient({ baseUrl: "https://matrix.org" });
        setClientAndSyncStateCallback(baseClient);
        return;
      }

      const accessToken = await SecureStore.getItemAsync("accessToken");

      if (accessToken) {
        console.log(
          "Got access token from storage,",
          accessToken,
          "creating new client"
        );
        client.setAccessToken(accessToken);
        const { user_id: userId } = await client.whoami();
        client.credentials.userId = userId;
        setClientAndSyncStateCallback(client);
      }
    }
    setClientWithTokenIfExists();
  }, [client]);

  useEffect(() => {
    if (!client || !client.isLoggedIn()) return;

    console.log(`Logged in as ${client.getUserId()}`);

    client.on(
      sdk.RoomEvent.Timeline,
      function (event, room, toStartOfTimeline) {
        if (toStartOfTimeline) {
          return; // don't print paginated results
        }
        if (event.getType() !== EventUnstableEventType.value) {
          return; // only print messages
        }
        console.log(
          // the room name will update with m.room.name events automatically
          "(%s) %s :: %s",
          room.name,
          event.getSender(),
          JSON.stringify(event.getContent())
        );
        dispatch({
          type: "SET_MATRIX_EVENT",
          name: event.getContent().name,
          eventId: event.getId(),
          date: new Date(event.getContent().date),
          description: event.getContent().description,
          venue: event.getContent().venue,
          rootEventRoomId: event.getContent().roomId,
          sharedEventIds: event.getContent().sharedEventIds,
        });
      }
    );
    if (clientSyncState === null || "STOPPED") client.startClient();
    return () => {
      client.stopClient();
    };
  }, [client, clientSyncState, refresh]);

  useEffect(() => {
    if (refresh) setRefresh(false);
  }, [refresh]);

  return {
    client,
    setClient: setClientAndSyncStateCallback,
    clientSyncState,
    setRefresh,
  };
}
