import { sample } from "../assets/data/sample";
import { parseIcal } from "../lib/ical";
import { ICalendar } from "../../types";

export const parsedIcal: ICalendar[] = parseIcal(sample).map(calendar => {
  return {
    calendar: calendar,
    url: "placeholder_url",
    name: "Sample iCalendar",
  };
});
