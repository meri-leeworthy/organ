/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Text as DefaultText,
  View as DefaultView,
  TextInput as DefaultTextInput,
  Pressable,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

import Colors from "app/constants/Colors";
import { useColorScheme } from "app/hooks/useColorScheme";
import { StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];
export type TextInputProps = ThemeProps & DefaultTextInput["props"];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function TextInput(props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <DefaultTextInput
      style={[{ color, backgroundColor }, styles.input, style]}
      {...otherProps}
      placeholderTextColor={"#999"}
    />
  );
}

export function HorizontalRule() {
  return <View style={styles.hr} />;
}

export function Button({
  onPress,
  text,
  variant,
  style,
  textStyle,
}: {
  onPress: ((event: GestureResponderEvent) => void) | null | undefined;
  text: string;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        variant === "secondary" ? styles.buttonSecondary : null,
        style,
      ]}>
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.buttonTextSecondary : null,
          textStyle,
        ]}>
        {text}
      </Text>
    </Pressable>
  );
}

export function LinkButton({
  onPress,
  text,
  style,
  textStyle,
}: {
  onPress:
    | (((event: GestureResponderEvent) => void) & (() => void))
    | undefined;
  text: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.link, style]}>
      <Text style={[styles.linkText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    fontFamily: "work-sans",
    fontSize: 20,
  },
  hr: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: 30,
    height: 1,
    width: "100%",
  },
  button: {
    backgroundColor: "#8D9EFF",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    height: 48,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontFamily: "work-sans",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8D9EFF",
  },
  buttonTextSecondary: {
    color: "#8D9EFF",
  },
  link: {
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
