import * as sdk from "matrix-js-sdk";
import { useStateValue } from "../state/context";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useRetry } from "./useRetry";
import { MatrixRoomList } from "../types";

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
  const [{ client }, dispatch] = useStateValue();
  const [localClient, setLocalClient] = useState<sdk.MatrixClient | undefined>(
    client
  );
  const [localClientChangeFlag, setLocalClientChangeFlag] = useState(false); //this is a hack to force a rerender when the client changes
  const [clientSyncState, setClientSyncState] = useState<ClientSyncState>(null);
  const attemptCount = useRetry(3);

  function setClient(newClient: sdk.MatrixClient) {
    newClient.once(sdk.ClientEvent.Sync, (state: ClientSyncState) =>
      setClientSyncState(state)
    );
    setLocalClient(newClient);
    setLocalClientChangeFlag(true);
    dispatch({
      type: "SET_CLIENT",
      client: newClient,
    });
  }

  useEffect(() => {
    if (!client) return;
    const rooms = client.getRooms();
    const roomIds: MatrixRoomList | undefined = rooms?.map(room => {
      return { roomId: room.roomId, roomName: room.name };
    });

    if (roomIds && roomIds.length > 0) {
      AsyncStorage.setItem("matrixRooms", JSON.stringify(roomIds)); //could throw
      dispatch({ type: "SET_MATRIX_ROOMS", matrixRooms: roomIds });
    }
  }, [attemptCount, clientSyncState]);

  useEffect(() => {
    async function setClientWithTokenIfExists() {
      if (!!client && client.isLoggedIn()) return;

      if (!client) {
        const baseClient = sdk.createClient({ baseUrl: "https://matrix.org" });
        setClient(baseClient);
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
        setClient(client);
      }
    }
    setClientWithTokenIfExists();
  }, [client, localClient]);

  useEffect(() => {
    if (!localClient) return;
    if (!localClient.isLoggedIn()) {
      console.log("loggint in? ", localClient.isLoggedIn());
      return;
    }

    console.log(`Logged in as ${localClient.getUserId()}`);

    localClient.on(
      sdk.RoomEvent.Timeline,
      function (event, room, toStartOfTimeline) {
        if (toStartOfTimeline) {
          return; // don't print paginated results
        }
        if (event.getType() !== "directory.radical.event.v1") {
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
          type: "ADD_MATRIX_EVENT",
          name: event.getContent().name,
          eventId: event.getId(),
          date: new Date(event.getContent().date),
          description: event.getContent().description,
          venue: event.getContent().venue,
          calendarId: room.roomId,
        });
      }
    );
    if (clientSyncState === null || "STOPPED") localClient.startClient();
    return () => {
      localClient.stopClient();
    };
  }, [localClient, clientSyncState, localClientChangeFlag]);

  useEffect(() => {
    setLocalClientChangeFlag(false);
  }, [localClientChangeFlag]);

  return { client: localClient, setClient, clientSyncState };
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
