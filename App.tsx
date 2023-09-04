import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useCachedResources } from "app/hooks/useCachedResources";
import { useColorScheme } from "app/hooks/useColorScheme";
import Navigation from "app/navigation";
import { StateProvider } from "app/state/context";
import { reducer } from "app/state/reducers";

export default function App() {
  const colorScheme = useColorScheme();

  const { isLoadingComplete } = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <StateProvider
          reducer={reducer}
          initialState={{
            user: {},
            calendars: new Map(),
            matrixRoomIds: new Set(),
            standardRooms: new Map(),
            events: new Map(),
          }}>
          <Navigation colorScheme={colorScheme} />
          <StatusBar />
        </StateProvider>
      </SafeAreaProvider>
    );
  }
}

// the following code is a polyfill for the EventEmitter class and document object
import { EventEmitter } from "fbemitter";

class Document {
  emitter: any;

  constructor() {
    this.emitter = new EventEmitter();
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this._checkEmitter = this._checkEmitter.bind(this);
  }

  createElement(tagName: any) {
    return {};
  }

  _checkEmitter() {
    if (
      !this.emitter ||
      !(
        this.emitter.on ||
        this.emitter.addEventListener ||
        this.emitter.addListener
      )
    ) {
      this.emitter = new EventEmitter();
    }
  }

  addEventListener(eventName: any, listener: any) {
    this._checkEmitter();
    if (this.emitter.on) {
      this.emitter.on(eventName, listener);
    } else if (this.emitter.addEventListener) {
      this.emitter.addEventListener(eventName, listener);
    } else if (this.emitter.addListener) {
      this.emitter.addListener(eventName, listener);
    }
  }

  removeEventListener(eventName: any, listener: any) {
    this._checkEmitter();
    if (this.emitter.off) {
      this.emitter.off(eventName, listener);
    } else if (this.emitter.removeEventListener) {
      this.emitter.removeEventListener(eventName, listener);
    } else if (this.emitter.removeListener) {
      this.emitter.removeListener(eventName, listener);
    }
  }
}

window.document = window.document || new Document();
//end polyfill
