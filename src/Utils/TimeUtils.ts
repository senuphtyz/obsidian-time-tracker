import { App, TFile } from "obsidian";
import type { TimeTrackerSettings } from "../Types/TimeTrackerSettings";
import { getDailyNoteSettings, getFrontMatter } from "./NoteUtils";
import type WorkTimes from "../Types/WorkTimes";
import moment from "moment";

/**
 * Calculates work time for frontmatter of given file.
 * 
 * @returns HH:mm formatted string or error string.
 */
export function calculateWorkTimeOfFile(app: App, file: TFile | null, settings: TimeTrackerSettings): string {
    if (file === null) {
        return "🕑 No daily Note";
    }

    return calculateWorkTime(getWorkTimesOfFile(app, file, settings))
}

/**
 * Calculates work time for given times.
 * 
 * @returns HH:mm formatted string or error string.
 */
export function calculateWorkTime(wt: WorkTimes): string {
    if (!wt.work_start) {
        return "🕑 Work not started";
    }

    const start = moment.duration(wt.work_start);
    const end = wt.work_end ? moment.duration(wt.work_end) : moment.duration(moment().format("HH:mm"));
    let diff = end.subtract(start)

    if (!!wt.pause_start && !!wt.pause_end) {
        diff = diff.subtract(
            moment.duration(wt.pause_end).subtract(moment.duration(wt.pause_start))
        )
    }

    const hours = diff.asHours();

    return `🕑 ${(hours | 0).toString().padStart(2, '0')}:${(Math.round(hours % 1 * 60)).toString().padStart(2, '0')}`;
}


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