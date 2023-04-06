import { sample } from "../assets/data/sample";
import { parseIcal } from "../lib/ical";
import { LinkedCalendar } from "./context";

export const parsedIcal: LinkedCalendar[] = parseIcal(sample).map(calendar => {
  return {
    calendar: calendar,
    url: "link_placeholder",
  };
});
