import * as sdk from "matrix-js-sdk";
import { useStateValue } from "../state/context";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useRetry } from "./useRetry";

type ClientSyncState =
  | null
  | "PREPARED"
  | "SYNCING"
  | "STOPPED"
  | "CATCHUP"
  | "RECONNECTING"
  | "ERROR";

export default function useMatrixClient(): {
  client: sdk.MatrixClient | undefined;
  setClient: (client: sdk.MatrixClient) => void;
  clientSyncState: ClientSyncState;
} {
  const [, dispatch] = useStateValue();
  const [client, setClientRaw] = useState<sdk.MatrixClient | undefined>(
    // client
    undefined
  );
  const [clientChangeFlag, setClientChangeFlag] = useState(false); //this is to force a rerender when the client changes, because of shallow object equality
  const [clientSyncState, setClientSyncState] = useState<ClientSyncState>(null);
  // const attemptCount = useRetry(3);

  function setClientAndSyncStateCallback(newClient: sdk.MatrixClient) {
    newClient.once(sdk.ClientEvent.Sync, (state: ClientSyncState) =>
      setClientSyncState(state)
    );
    setClientRaw(newClient);
    setClientChangeFlag(true);
    // dispatch({
    //   type: "SET_CLIENT",
    //   client: newClient,
    // });
  }

  useEffect(() => {
    if (!client) return;
    const rooms = client.getRooms();
    const roomIds = new Set(rooms?.map(room => room.roomId));

    if (roomIds && rooms.length > 0) {
      dispatch({ type: "SET_MATRIX_ROOMS", matrixRooms: roomIds });

      //need to check if the room is a calendar room! currently this does nothing
      rooms.forEach(room => {
        dispatch({
          type: "SET_MATRIX_CALENDAR",
          roomId: room.roomId,
          roomName: room.name,
          roomType: undefined,
        });
      });
    }
  }, [clientSyncState]);

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
        if (event.getType() !== "directory.radical.event.unstable") {
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
  }, [client, clientSyncState, clientChangeFlag]);

  useEffect(() => {
    if (clientChangeFlag) setClientChangeFlag(false);
  }, [clientChangeFlag]);

  return { client, setClient: setClientAndSyncStateCallback, clientSyncState };
}

// Here is some code that was added to the client config
// to try to make it work with a later version of matrix-js-sdk:

// fetchFn: (req, args) => {
//   const url =
//     typeof req === "string" ? req : "url" in req ? req.url : req.href;
//   const noqueries = url.split("?")[0];
//   return fetch(noqueries, args);
// },

// async function isAccessTokenValid(client: sdk.MatrixClient) {
//   if (!client) return false;
//   if (!client.isLoggedIn()) return false;
//   try {
//     const id = await client.whoami();
//     console.log("whoami:", id);
//     return true;
//   } catch {
//     return false;
//   }
// }

// if (await isAccessTokenValid(client)) {
//   console.log("stored access token is valid, setting client");
//   setClient(client);
//   return;
// }

// console.log("stored access token was invalid, attempting to refresh token");

// const refreshToken = await SecureStore.getItemAsync("refreshToken");

// if (!refreshToken) throw new Error("No refresh token found");

// console.log("refreshToken:", refreshToken);

// try {
// const res = await client.refreshToken(refreshToken);

// console.log("refreshToken response:", res);

// const newAccessToken = await SecureStore.setItemAsync(
//   "accessToken",
//   res.access_token
// );
// console.log("newAccessToken:", newAccessToken);
// const newRefreshToken = await SecureStore.setItemAsync(
//   "refreshToken",
//   res.refresh_token
// );
// console.log("newRefreshToken:", newRefreshToken);

// setClient(
//   sdk.createClient({
//     baseUrl: "https://matrix.org",
//     accessToken: res.access_token,
//   })
// );
