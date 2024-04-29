import moment from "moment";
import type { TAbstractFile } from "obsidian";
import type TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { getDailyNoteSettings, isDailyNote } from "src/Utils/NoteUtils";
import type { TaskTrackingEntry } from "./Types/TaskTrackingEntry";
import { type DataviewApi } from "obsidian-dataview";
import type { Task } from "./Types/Task";
import { distance } from "fastest-levenshtein";
import type { TaskListEntry } from "./Types/TaskListEntry";
import type { TaskTrackingCache } from "./Cache/TaskTrackingCache";


type LevenshteinMap = { task: Task, distance: number };

export class TaskTrackingService {
    readonly FRONT_MATTER_KEY = "time_tracking";
    // private currentActiveTaskTracking: TaskListEntry | undefined;


    constructor(
        private plugin: TimeTrackerPlugin,
        private cache: TaskTrackingCache,
        private api: DataviewApi
    ) {
        this.cacheTrackingData();

        this.plugin.registerEvent(plugin.app.vault.on('modify', (abstractFile: TAbstractFile) => {
            if (isDailyNote(plugin.app, abstractFile)) {
                this.updateCacheForFile(abstractFile);
            }
        }));
    }

    private findReferencedTask(taskTrackingEntry: TaskTrackingEntry) {
        // If a direct matcht could not be found pick the task with the smallest distance between
        // task and tracking entry.
        // This part of the code might be a performance issue in the future
        // idea might be to prefilter based on length of both strings
        const referencedTask = this.api.pages().file.tasks
            .filter((task: Task) => task.text != "")
            .map((task: Task) => {
                return { task: task, distance: distance(task.text, taskTrackingEntry.task) }
            })
            .filter((i: LevenshteinMap) => {
                return i.distance / taskTrackingEntry.task.length <= 0.25;
            })
            .sort((i: LevenshteinMap) => i.distance)
            .map((i: LevenshteinMap) => i.task)
            .first();

        return referencedTask;
    }


    private updateCacheForFile(abstractFile: TAbstractFile): boolean {
        const fm = this.plugin.app.metadataCache.getCache(abstractFile.path)?.frontmatter;
        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        if (!fm || !(this.FRONT_MATTER_KEY in fm)) {
            return false;
        }

        const dateString = moment(abstractFile.name, dailyNoteSettings.format).format("YYYY-MM-DD");

        for (const t of (fm[this.FRONT_MATTER_KEY] as TaskTrackingEntry[])) {
            const taskList = this.api.pages().file.tasks.filter((task: Task) => task.text == t.task);
            let referencedTask: Task | null = null;

            if (taskList.length == 1) {
                referencedTask = taskList[0];
            } else if (taskList.length == 0) {
                referencedTask = this.findReferencedTask(t);
            }

            this.cache.addEntry({
                date: dateString,
                entry: t,
                taskReference: referencedTask
            }, abstractFile.path)
        }

        return true;
    }

    /**
     * Returns the current running task
     */
    get runningTaskEntry(): TaskListEntry | undefined {
        const runningTask = this.cache.runningTaskEntry;

        if (runningTask) {
            const last = this.cache.getLastTrack(runningTask.entry.task);
            const today = moment().format("YYYY-MM-DD");

            return {
                path: runningTask.taskReference?.path ? runningTask.taskReference.path : "",
                text: runningTask.entry.task,
                start: moment(`${today} ${runningTask.entry.start}`, "YYYY-MM-DD HH:mm"),
                last: last ? {
                    start: moment(`${last.date} ${last.entry.start}`, 'YYYY-MM-DD HH:mm'),
                    end: moment(`${last.date} ${last.entry.end}`, 'YYYY-MM-DD HH:mm'),
                } : null
            }
        }

        return undefined;
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
                for (const itm of this.cache) {
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

    stopRunningTracking() {
        const runningTaskEntry = this.cache.runningTaskEntry;
        if (!runningTaskEntry) {
            return;
        }

        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${moment(runningTaskEntry.date, 'YYYY-MM-DD').format(dailyNoteSettings.format)}.md`);
        if (!file) {
            return;
        }

        this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
            for (const i of fm[this.FRONT_MATTER_KEY]) {
                const itm = (i as TaskTrackingEntry);

                if (itm.task == this.runningTaskEntry?.text && itm.start == this.runningTaskEntry.start?.format('HH:mm')) {
                    itm.end = moment().format('HH:mm')

                    if (itm.start == itm.end) {
                        fm[this.FRONT_MATTER_KEY].splice(fm[this.FRONT_MATTER_KEY].indexOf(itm), 1);
                    }

                    this.cache.clearRunningTaskEntry();
                    return;
                }
            }
        });
    }

    startTracking(taskText: string, filePath: string) {
        this.stopRunningTracking();

        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${moment().format(dailyNoteSettings.format)}.md`);
        if (!file) {
            return;
        }

        this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
            console.info("PROCESS");
            if (!(this.FRONT_MATTER_KEY in fm)) {
                fm[this.FRONT_MATTER_KEY] = [];
            }

            const now = moment();
            const entry: TaskTrackingEntry = {
                task: taskText,
                start: now.format("HH:mm"),
                end: "",
                payload: {},
            };


            fm[this.FRONT_MATTER_KEY].push(entry);
            this.cache.addEntry({
                date: moment().format("YYYY-MM-DD"),
                entry: entry,
                taskReference: this.findReferencedTask(entry)
            }, file.path)
        });
    }
}