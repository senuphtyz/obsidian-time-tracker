import moment from "moment";
import type { FrontMatterCache, TFile } from "obsidian";
import type TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { findDailyNoteOfToday, getDailyNoteSettings } from "src/Utils/NoteUtils";
import type { TaskTrackingEntry } from "./TaskTrackingEntry";
import { DailyNotMissingException, TaskTrackingException } from "src/Exception";


export class TaskTrackingService {
    frontMatterKey: string;

    constructor(private plugin: TimeTrackerPlugin) {
        this.frontMatterKey = "time_tracking";
    }

    private readFrontMatterTasks(file: TFile): TaskTrackingEntry[] {
        const fm = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
        const ret: TaskTrackingEntry[] = [];

        if (!fm || !fm[this.frontMatterKey]) {
            return ret;
        }

        for (const itm of fm[this.frontMatterKey]) {
            if (typeof itm == 'object') {
                ret.push(itm as TaskTrackingEntry);
            }
        }

        return ret;
    }

    /**
     * Search for a task and find its latest time track entry.
     * 
     * @param task Task to find
     * @param last Maximum amount of days to look for last entry.
     * @returns 
     */
    findLastTrackedTaskTime(task: string, last: number = 90): { start: string, end: string } | null {
        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        let start = moment();

        for (let i = 1; i < last; i++) {
            start = start.subtract(1, 'day');
            const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${start.format(dailyNoteSettings.format)}.md`);

            if (!file) {
                continue;
            }

            const fmTasks = this.readFrontMatterTasks(file)
                .filter((t) => t.task == task)
                .filter((t) => t.start && t.end)
                .sort((l, r) =>
                    moment(l.start, this.plugin.settings.time_format)
                        .isBefore(moment(r.start, this.plugin.settings.time_format)) ? -1 : 1
                );

            if (fmTasks.length > 0) {
                const l = fmTasks[fmTasks.length - 1];

                return {
                    start: start.format("YYYY-MM-DD") + " " + l.start,
                    end: start.format("YYYY-MM-DD") + " " + l.end,
                }
            }
        }

        return null;
    }

    /**
     * Returns current running TaskTrackingEntry.
     * 
     * @param fm 
     * @returns 
     */
    getRunningTask(fm: FrontMatterCache | undefined): TaskTrackingEntry | null {
        if (!fm) {
            const dailyNote = findDailyNoteOfToday(this.plugin.app);

            if (!dailyNote) {
                return null;
            }

            fm = this.plugin.app.metadataCache.getFileCache(dailyNote)?.frontmatter;

            if (!fm) {
                return null;
            }
        }

        if (!(this.frontMatterKey in fm)) {
            return null;
        }

        const taskTrackingEntry = fm[this.frontMatterKey]
            .filter((t: TaskTrackingEntry) => t.start != "" && t.end == "");

        if (taskTrackingEntry.length > 1) {
            throw new TaskTrackingException("There is more than one running task tracking. Manually stop at least one");
        }

        return taskTrackingEntry.length == 1 ? taskTrackingEntry[0] : null;
    }

    /**
     * Stop the given running task.
     * 
     * @param task 
     * @returns 
     */
    stopTaskTracking(task: string): boolean {
        const todaysDailyNote = findDailyNoteOfToday(this.plugin.app);

        if (!todaysDailyNote) {
            throw new DailyNotMissingException();
        }

        const fm = this.plugin.app.metadataCache.getFileCache(todaysDailyNote)?.frontmatter;

        if (!fm) {
            throw new TaskTrackingException("Could not find Frontmatter for todays daily note");
        }

        const currentRunning = this.getRunningTask(fm);

        if (!currentRunning) {
            return true;
        }

        if (currentRunning.task == task) {
            currentRunning.end = moment().format("HH:mm");
            return true;
        }

        return false;
    }

    /**
     * Start time tracking in dailyNote for given task.
     * 
     * @param task 
     * @returns 
     */
    startTaskTracking(task: string): boolean {
        const todaysDailyNote = findDailyNoteOfToday(this.plugin.app);

        if (!todaysDailyNote) {
            throw new DailyNotMissingException();
        }

        const fm = this.plugin.app.metadataCache.getFileCache(todaysDailyNote)?.frontmatter;

        if (!fm) {
            throw new TaskTrackingException("Could not find Frontmatter for todays daily note");
        }

        if (!(this.frontMatterKey in fm)) {
            fm[this.frontMatterKey] = [];
        }

        const currentRunningTaskEntry = this.getRunningTask(fm);

        if (currentRunningTaskEntry?.task == task) {
            return false;
        }

        if (currentRunningTaskEntry) {
            if (!this.stopTaskTracking(task)) {
                throw new TaskTrackingException("Could not stop current running task tracking");
            }
        }

        const te: TaskTrackingEntry = {
            task: task,
            start: moment().format("HH:mm"),
            end: "",
            payload: {}
        }

        fm[this.frontMatterKey].push(te);

        return true;
    }
}