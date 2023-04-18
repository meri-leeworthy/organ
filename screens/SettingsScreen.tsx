import { Text, View, TextInput } from "../components/Themed";
import { StyleSheet, Button } from "react-native";
import { useState, useEffect } from "react";
import { useStateValue } from "../state/context";
import { parseIcal } from "../lib/ical";

export default function SettingsScreen() {
  const [{ calendars }, dispatch] = useStateValue();
  const [url, setUrl] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading) return;

    fetch(url)
      .then(response => response.text())
      .then(text => {
        dispatch({ type: "ADD_ICALENDAR", url, calendar: parseIcal(text)[0] });
        setLoading(false);
      })
      .catch(error => setError(error));
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Calendar</Text>
      <TextInput onChangeText={setUrl} value={url} placeholder="Enter URL" />
      <Button
        title="Add"
        onPress={() => {
          setLoading(true);
        }}
      />
      {error && <Text>error</Text>}
      {calendars.map((calendar, i) => (
        <Text key={i}>{calendar.url}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
