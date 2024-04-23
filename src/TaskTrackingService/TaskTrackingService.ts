import moment from "moment";
import type { TFile } from "obsidian";
import type TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { getDailyNoteSettings } from "src/Utils/NoteUtils";
import type { TaskTrackingEntry } from "./TaskTrackingEntry";


export class TaskTrackingService {
    constructor(private plugin: TimeTrackerPlugin) {
    }

    private readFrontMatterTasks(file: TFile): TaskTrackingEntry[] {
        const fm = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
        const ret: TaskTrackingEntry[] = [];

        if (!fm || !fm['time_tracking']) {
            return ret;
        }

        for (const itm of fm['time_tracking']) {
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
                .sort((l, r) => moment(l.start, this.plugin.settings.time_format).isBefore(moment(r.start, this.plugin.settings.time_format)) ? -1 : 1);

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

}