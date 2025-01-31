import { App, TFile } from "obsidian";
import type { TimeTrackerSettings } from "../Types/TimeTrackerSettings";
import { getDailyNoteSettings, getFrontMatter } from "./NoteUtils";
import type WorkTimes from "../Types/WorkTimes";
import moment from "moment";

/**
 * Builds a full date of given time and file.
 */
export function buildFullDate(time: string, app: App, file: TFile, settings: TimeTrackerSettings, format: string = "YYYY-MM-DD HH:mm"): string {
  const dailyNoteSettings = getDailyNoteSettings(app);

  const pTime = moment.utc(time, settings.time_format)
  return moment(file.basename, dailyNoteSettings.format).set({
    'hour': pTime.hours(),
    'minute': pTime.minutes(),
  }).format(format);
}


/**
 * Return work times of given file.
 */
export function getWorkTimesOfFile(app: App, file: TFile, settings: TimeTrackerSettings, fullDates: boolean = false, fullDateFormat: string = "YYYY-MM-DD HH:mm"): WorkTimes {
  const fm = getFrontMatter(app, file);

  if (!fullDates) {
    return {
      work_start: fm[settings.property_work_start],
      pause_start: fm[settings.property_pause_start],
      pause_end: fm[settings.property_pause_end],
      work_end: fm[settings.property_work_end],
    }
  }

  return {
    work_start: buildFullDate(fm[settings.property_work_start], app, file, settings, fullDateFormat),
    pause_start: buildFullDate(fm[settings.property_pause_start], app, file, settings, fullDateFormat),
    pause_end: buildFullDate(fm[settings.property_pause_end], app, file, settings, fullDateFormat),
    work_end: buildFullDate(fm[settings.property_work_end], app, file, settings, fullDateFormat),
  }
}