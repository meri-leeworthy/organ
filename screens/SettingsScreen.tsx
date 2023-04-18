import { Text, View, TextInput } from "../components/Themed";
import { StyleSheet, Button } from "react-native";
import { useState, useEffect } from "react";
import { useStateValue } from "../state/context";
import { parseIcal } from "../lib/ical";

// matches #room:server.tld or !room:server.tld
const MATRIX_FQID = /^(\!|#)\w+:[\w.-]+\.\w+$/;

// matches https://matrix.to/#/#room:server.tld or https://matrix.to/#/!room:server.tld
// or #room:server.tld or !room:server.tld and may include query parameters
const MATRIX_CATCHALL =
  /^(https?:\/\/matrix\.to\/#\/)?(\!|#)([a-zA-Z0-9=_\-\/]+):([a-zA-Z0-9._-]+)?(\?.*)?$/;

const URL_SCHEME = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

type UrlType = "none" | "matrix" | "ical";

export default function SettingsScreen() {
  const [{ calendars }, dispatch] = useStateValue();
  const [url, setUrl] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [urlType, setUrlType] = useState<UrlType>("none");

  function inputHandler(value: string) {
    setUrl(value);
    if (MATRIX_CATCHALL.test(value)) {
      setUrlType("matrix");
    } else if (URL_SCHEME.test(value)) {
      setUrlType("ical");
    } else {
      setUrlType("none");
    }
  }

  const ValidationMessage = () => {
    switch (urlType) {
      case "none":
        return <Text>Invalid URL</Text>;
      case "matrix":
        return <Text>Matrix URL</Text>;
      case "ical":
        return <Text>ICal URL</Text>;
    }
  };

  function addHandler() {
    if (urlType === "none") return;
    // TODO only show error to user now
    setLoading(true);
  }

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
      <TextInput
        onChangeText={inputHandler}
        value={url}
        placeholder="Enter URL"
      />
      <Button title="Add" onPress={addHandler} />
      <ValidationMessage />
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
