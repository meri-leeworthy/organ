import * as sdk from "matrix-js-sdk";
import { useStateValue } from "../state/context";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

// this hook should return a local client instance and keep it in sync with the global client state

export default function useMatrixClient(): {
  client: sdk.MatrixClient | undefined;
  setClient: (client: sdk.MatrixClient) => void;
} {
  const [{ client }, dispatch] = useStateValue();
  const [localClient, setLocalClient] = useState<sdk.MatrixClient | undefined>(
    client
  );

  function setClient(newClient: sdk.MatrixClient) {
    console.log("useMatrixClient: setting client");
    setLocalClient(newClient);
    dispatch({
      type: "SET_CLIENT",
      client: newClient,
    });
  }

  useEffect(() => {
    async function setClientWithTokenIfExists() {
      const baseClient = client
        ? client
        : sdk.createClient({ baseUrl: "https://matrix.org" });

      const accessToken = await SecureStore.getItemAsync("accessToken");

      if (!accessToken) throw new Error("No access token found");

      console.log(
        "Got access token from storage,",
        accessToken,
        "creating new client"
      );

      baseClient.setAccessToken(accessToken);

      console.log("client isLoggedIn?:", baseClient.isLoggedIn());

      const { user_id: userId } = await baseClient.whoami();
      baseClient.credentials.userId = userId;

      setClient(baseClient);
      setLocalClient(baseClient);
    }
    setClientWithTokenIfExists();
  }, [client]);

  return { client: localClient, setClient };
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
