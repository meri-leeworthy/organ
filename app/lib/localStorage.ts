import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageKey, AsyncStorageValue } from "app/types";

export async function setAsyncStorage<T extends AsyncStorageKey, U>(
  key: T,
  value: AsyncStorageValue<T, U>
) {
  const stringifiedValue = JSON.stringify(value, replacer);
  return await AsyncStorage.setItem(key, stringifiedValue);
}

export async function getAsyncStorage<T extends AsyncStorageKey, U>(
  key: T
): Promise<AsyncStorageValue<T, U> | null> {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value, reviver) : null;
}

export function replacer(key: unknown, value: unknown) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else if (value instanceof Set) {
    return {
      dataType: "Set",
      value: Array.from(value.values()),
    };
  }
  return value;
}

export function reviver(_key: unknown, value: unknown) {
  if (typeof value === "object" && value !== null) {
    if (
      "dataType" in value &&
      "value" in value &&
      value.dataType === "Map" &&
      Array.isArray(value.value)
    ) {
      return new Map(value.value);
    } else if (
      "dataType" in value &&
      "value" in value &&
      value.dataType === "Set" &&
      Array.isArray(value.value)
    ) {
      return new Set(value.value);
    } else if ("date" in value && typeof value.date === "string") {
      return {
        ...value,
        date: new Date(value.date),
      };
    }
  }
  return value;
}

export function setValuesOrEmptyArray<T>(maybeSet: Set<T> | T[] | undefined) {
  return maybeSet instanceof Set ? [...maybeSet.values()] : [];
}

export function mapEntriesOrEmptyArray<T, U>(
  maybeMap: Map<T, U> | undefined
): [T, U][] {
  return maybeMap instanceof Map ? [...maybeMap.entries()] : [];
}
