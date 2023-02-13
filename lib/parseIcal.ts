import { lines2tree } from "icalts";
import { TreeType } from "icalts/dist/src/types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const GCAL_DATETIME_FORMAT = "YYYYMMDDTHHmmssZ";
export const GCAL_DATE_FORMAT = "YYYYMMDD";

export type GDate =
  | string
  | {
      VALUE: "DATE";
      key: "DTSTART";
      __value__: string;
    };

export type IcalEvent = TreeType & {
  SUMMARY: string;
  DTSTART: GDate;
  DTEND?: string;
  UID: string;
};

export type DateOrDateTime = {
  type: "DATE" | "DATETIME";
  value: dayjs.Dayjs;
};

export function parseDate(dateTime: GDate): DateOrDateTime {
  if (typeof dateTime === "string") {
    const parsed = dayjs(dateTime, GCAL_DATETIME_FORMAT);
    return { type: "DATETIME", value: parsed };
  } else {
    return { type: "DATE", value: dayjs(dateTime.__value__, GCAL_DATE_FORMAT) };
  }
}

export function parseIcal(sample: string) {
  const ical = lines2tree(sample.split("\n"));

  if (
    "VCALENDAR" in ical &&
    Array.isArray(ical.VCALENDAR) &&
    ical.VCALENDAR.length > 0
  ) {
    return ical.VCALENDAR;
  } else throw new Error("No calendars found");
}

export function dateSort(a: GDate, b: GDate): number {
  const aString = typeof a === "string" ? a.slice(0, 8) : a.__value__;
  const bString = typeof b === "string" ? b.slice(0, 8) : b.__value__;

  if (aString === bString && typeof a === "string" && typeof b === "string") {
    // if dates are equal, compare times
    return Number.parseInt(a.slice(9)) - Number.parseInt(b.slice(9));
  }

  return Number.parseInt(aString) - Number.parseInt(bString);
}
