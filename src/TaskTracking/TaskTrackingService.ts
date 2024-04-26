import moment from "moment";
import type { TAbstractFile } from "obsidian";
import type TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { getDailyNoteSettings, isDailyNote } from "src/Utils/NoteUtils";
import type { TaskTrackingEntry } from "./Types/TaskTrackingEntry";
import { getAPI, type DataviewApi } from "obsidian-dataview";
import type { Task } from "./Types/Task";
import { distance } from "fastest-levenshtein";
import type { TaskListEntry } from "./Types/TaskListEntry";
import { BackInTimeIterator, type TaskTrackingCache, type TaskTrackingCacheItem } from "./Types/TaskTrackingCache";
import type { ReferencedTrackingEntry } from "./Types/ReferencedTrackingEntry";


type LevenshteinMap = { task: Task, distance: number };

export class TaskTrackingService {
    readonly FRONT_MATTER_KEY = "time_tracking";
    api: DataviewApi;
    cache: TaskTrackingCache = {};


    constructor(private plugin: TimeTrackerPlugin) {
        this.api = getAPI(plugin.app);

        this.cacheTrackingData();

        this.plugin.registerEvent(plugin.app.vault.on('modify', (abstractFile: TAbstractFile) => {
            if (isDailyNote(plugin.app, abstractFile)) {
                this.updateCacheForFile(abstractFile);
            }
        }));
    }

    private updateCacheForFile(abstractFile: TAbstractFile): boolean {
        const fm = this.plugin.app.metadataCache.getCache(abstractFile.path)?.frontmatter;
        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        if (!fm || !(this.FRONT_MATTER_KEY in fm)) {
            return false;
        }

        const dateString = moment(abstractFile.name, dailyNoteSettings.format).format("YYYY-MM-DD");

        if (!(dateString in this.cache)) {
            this.cache[dateString] = {
                file: abstractFile.path,
                entries: [],
            }
        }

        for (const t of (fm[this.FRONT_MATTER_KEY] as TaskTrackingEntry[])) {
            const taskList = this.api.pages().file.tasks.filter((task: Task) => task.text == t.task);
            let referencedTask: Task | null = null;

            if (taskList.length == 1) {
                referencedTask = taskList[0];
            } else if (taskList.length == 0) {
                // If a direct matcht could not be found pick the task with the smallest distance between
                // task and tracking entry.
                // This part of the code might be a performance issue in the future
                // idea might be to prefilter based on length of both strings
                referencedTask = this.api.pages().file.tasks
                    .filter((task: Task) => task.text != "")
                    .map((task: Task) => {
                        return { task: task, distance: distance(task.text, t.task) }
                    })
                    .filter((i: LevenshteinMap) => i.distance / t.task.length <= 0.25)
                    .sort((i: LevenshteinMap) => i.distance)
                    .map((i: LevenshteinMap) => i.task)[0];
            }

            this.cache[dateString].entries.push({
                entry: t,
                taskReference: referencedTask,
            });
        }

        return true;
    }

    getRunningTaskEntry(): TaskListEntry | undefined {
        const today = moment().format("YYYY-MM-DD");

        if (!this.cache[today]) {
            return;
        }

        const ret = this.cache[today].entries
            .filter(e => e.entry.start != "" && e.entry.end == "")
            .map(e => {
                return {
                    text: e.entry.task,
                    path: e.taskReference ? e.taskReference.path : "",
                    start: moment(`${today} ${e.entry.start}`, "YYYY-MM-DD HH:mm"),
                    last: null
                }
            }).first();

        if (ret) {
            const it = new BackInTimeIterator(this.cache);

            // for (const itm of it) {
            //     if (itm === null) {
            //         break;
            //     }

            //     const i = (itm as ReferencedTrackingEntry);

            //     if (i.entry.task == ret.text) {
            //         ret.last = {
            //             start: moment(`${today} ${i.entry.start}`, 'YYYY-MM-DD HH:mm'),
            //             end: moment(`${today} ${i.entry.end}`, 'YYYY-MM-DD HH:mm'),
            //         }
            //     }
            // }
        }

        return ret;
    }

    /**
     * Loads TaskTrackingEntries from the last days.
     * 
     * @param days 
     * @returns 
     */
    cacheTrackingData(days: number = 90) {
        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        let start = moment();
        for (let i = 1; i < days; i++) {
            const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${start.format(dailyNoteSettings.format)}.md`);
            if (!file) {
                continue;
            }

            this.updateCacheForFile(file);
            start = start.subtract(1, 'day');
        }
    }

    /**
     * Returns a list of tasks that the user might start in the near future.
     * 
     * @param amount 
     */
    getListOfPreselectedTasks(amount: number = 10): TaskListEntry[] {
        const ret: TaskListEntry[] = [];
        const tmpSet: Set<Task> = new Set();
        let start = moment();

        // 
        out: for (let i = 0; i < amount; i++) {
            const key = start.format("YYYY-MM-DD");

            if (key in this.cache) {
                for (const itm of this.cache[key].entries) {
                    if (!itm.taskReference || itm.taskReference.completed) {
                        continue
                    }

                    tmpSet.add(itm.taskReference);
                    ret.push({
                        text: itm.entry.task,
                        path: itm.taskReference.path,
                        start: undefined,
                        last: null
                    })

                    if (ret.length == amount) {
                        break out;
                    }
                }
            }

            start = start.subtract(1, 'day');
        }

        if (ret.length < amount) {
            // there are not enough tracked entries in last times so add some new tasks
            const tasks = this.api.pages().file.tasks
                .filter((t: Task) => !tmpSet.has(t))
                .filter((t: Task) => !t.completed);

            let i = 0;

            while (ret.length < amount) {
                ret.push({
                    text: tasks[i].text,
                    path: tasks[i].path,
                    start: undefined,
                    last: null,
                })

                i++;
            }
        }

        return ret;
    }


    // /**
    //  * Search for a task and find its latest time track entry.
    //  * 
    //  * @param taskName Task to find
    //  * @param last Maximum amount of days to look for last entry.
    //  * @returns 
    //  */
    // findLastTrackedTaskTime(taskName: string, last: number = 90) {
    //     const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

    //     let start = moment();

    //     for (let i = 1; i < last; i++) {
    //         start = start.subtract(1, 'day');
    //         const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${start.format(dailyNoteSettings.format)}.md`);

    //         if (!file) {
    //             continue;
    //         }

    //         const fmTasks = this.readFrontMatterTasks(file)
    //             .filter((t) => t.task == taskName)
    //             .filter((t) => t.start && t.end)
    //             .sort((l, r) =>
    //                 moment(l.start, this.plugin.settings.time_format)
    //                     .isBefore(moment(r.start, this.plugin.settings.time_format)) ? -1 : 1
    //             );

    //         if (fmTasks.length > 0) {
    //             const l = fmTasks[fmTasks.length - 1];

    //             return {
    //                 start: start.format("YYYY-MM-DD") + " " + l.start,
    //                 end: start.format("YYYY-MM-DD") + " " + l.end,
    //             }
    //         }
    //     }

    //     return null;
    // }


    // private readFrontMatterTasks(file: TFile): TaskTrackingEntry[] {
    //     const fm = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
    //     const ret: TaskTrackingEntry[] = [];

    //     if (!fm || !fm[this.frontMatterKey]) {
    //         return ret;
    //     }

    //     for (const itm of fm[this.frontMatterKey]) {
    //         if (typeof itm == 'object') {
    //             ret.push(itm as TaskTrackingEntry);
    //         }
    //     }

    //     return ret;
    // }

    // /**
    //  * Search for a task and find its latest time track entry.
    //  * 
    //  * @param taskName Task to find
    //  * @param last Maximum amount of days to look for last entry.
    //  * @returns 
    //  */
    // findLastTrackedTaskTime(taskName: string, last: number = 90): { start: string, end: string } | null {
    //     const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

    //     let start = moment();

    //     for (let i = 1; i < last; i++) {
    //         start = start.subtract(1, 'day');
    //         const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${start.format(dailyNoteSettings.format)}.md`);

    //         if (!file) {
    //             continue;
    //         }

    //         const fmTasks = this.readFrontMatterTasks(file)
    //             .filter((t) => t.task == taskName)
    //             .filter((t) => t.start && t.end)
    //             .sort((l, r) =>
    //                 moment(l.start, this.plugin.settings.time_format)
    //                     .isBefore(moment(r.start, this.plugin.settings.time_format)) ? -1 : 1
    //             );

    //         if (fmTasks.length > 0) {
    //             const l = fmTasks[fmTasks.length - 1];

    //             return {
    //                 start: start.format("YYYY-MM-DD") + " " + l.start,
    //                 end: start.format("YYYY-MM-DD") + " " + l.end,
    //             }
    //         }
    //     }

    //     return null;
    // }

    // /**
    //  * Returns current running TaskTrackingEntry.
    //  * 
    //  * @param fm 
    //  * @returns 
    //  */
    // getRunningTask(fm: FrontMatterCache | undefined = undefined): TaskTrackingEntry | null {
    //     if (!fm) {
    //         const dailyNote = findDailyNoteOfToday(this.plugin.app);

    //         if (!dailyNote) {
    //             return null;
    //         }

    //         fm = this.plugin.app.metadataCache.getFileCache(dailyNote)?.frontmatter;

    //         if (!fm) {
    //             return null;
    //         }
    //     }

    //     if (!(this.frontMatterKey in fm)) {
    //         return null;
    //     }

    //     const taskTrackingEntry = fm[this.frontMatterKey]
    //         .filter((t: TaskTrackingEntry) => t.start != "" && t.end == "");

    //     if (taskTrackingEntry.length > 1) {
    //         throw new TaskTrackingException("There is more than one running task tracking. Manually stop at least one");
    //     }

    //     return taskTrackingEntry.length == 1 ? taskTrackingEntry[0] : null;
    // }

    // /**
    //  * Stop the given running task.
    //  * 
    //  * @param taskName 
    //  * @returns 
    //  */
    // stopTaskTracking(taskName: string): boolean {
    //     const todaysDailyNote = findDailyNoteOfToday(this.plugin.app);

    //     if (!todaysDailyNote) {
    //         throw new DailyNotMissingException();
    //     }

    //     this.plugin.app.fileManager.processFrontMatter(todaysDailyNote, (fm) => {
    //         const currentRunning = this.getRunningTask(fm);

    //         if (!currentRunning) {
    //             return true;
    //         }

    //         if (currentRunning.task == taskName) {
    //             currentRunning.end = moment().format("HH:mm");
    //             return true;
    //         }
    //     });

    //     return false;
    // }

    // /**
    //  * Start time tracking in dailyNote for given task.
    //  * 
    //  * @param taskName 
    //  * @returns 
    //  */
    // startTaskTracking(taskName: string): boolean {
    //     const todaysDailyNote = findDailyNoteOfToday(this.plugin.app);

    //     if (!todaysDailyNote) {
    //         throw new DailyNotMissingException();
    //     }

    //     this.plugin.app.fileManager.processFrontMatter(todaysDailyNote, (fm) => {
    //         if (!(this.frontMatterKey in fm)) {
    //             fm[this.frontMatterKey] = [];
    //         }

    //         const currentRunningTaskEntry = this.getRunningTask(fm);

    //         if (currentRunningTaskEntry?.task == taskName) {
    //             return false;
    //         }

    //         if (currentRunningTaskEntry) {
    //             if (!this.stopTaskTracking(taskName)) {
    //                 throw new TaskTrackingException("Could not stop current running task tracking");
    //             }
    //         }

    //         const te: TaskTrackingEntry = {
    //             task: taskName,
    //             start: moment().format("HH:mm"),
    //             end: "",
    //             payload: {}
    //         }

    //         fm[this.frontMatterKey].push(te);
    //     });

    //     return true;
    // }

    // /**
    //  * Finds a task object by its name.
    //  * @param taskName 
    //  * @returns 
    //  */
    // findTaskByName(taskName: string): Task | null {
    //     const ret = this.api.pages().file.tasks.values.filter((t: Task) => t.text == taskName);

    //     if (ret.length == 1) {
    //         return ret[0];
    //     }

    //     return null;
    // }
}