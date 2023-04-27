import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { ReactNode } from "react";

export const DismissKeyboard = ({ children }: { children: ReactNode }) => (
  <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    {children}
  </TouchableWithoutFeedback>
);
