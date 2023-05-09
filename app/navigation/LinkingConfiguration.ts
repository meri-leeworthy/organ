/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { RootStackParamList } from "app/types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Drawer: "drawer",
      CreateEvent: "create-event",
      EditFollows: "edit-follows",
      Login: "login",
      Event: "event",
      NotFound: "*",
    },
  },
};

export default linking;
