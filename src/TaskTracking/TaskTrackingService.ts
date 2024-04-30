import moment from "moment";
import type { FrontMatterCache, TAbstractFile, TFile } from "obsidian";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { getDailyNoteSettings, isDailyNote } from "../Utils/NoteUtils";
import type { TaskTrackingEntry } from "./Types/TaskTrackingEntry";
import { type DataviewApi } from "obsidian-dataview";
import type { Task } from "./Types/Task";
import { distance } from "fastest-levenshtein";
import type { TaskListEntry } from "./Types/TaskListEntry";
import type { TaskTrackingCache } from "./Cache/TaskTrackingCache";
import type { NoteService } from "../NoteService";


type LevenshteinMap = { task: Task, distance: number };

export class TaskTrackingService {
    readonly FRONT_MATTER_KEY = "time_tracking";


    constructor(
        private plugin: TimeTrackerPlugin,
        private cache: TaskTrackingCache,
        private api: DataviewApi,
        private noteService: NoteService
    ) {
        this.plugin.registerEvent(plugin.app.vault.on('modify', (abstractFile: TAbstractFile) => {
            if (isDailyNote(plugin.app, abstractFile)) {
                this.updateCacheForFile(abstractFile);
            }
        }));
    }

    private findReferencedTask(taskTrackingEntry: TaskTrackingEntry) {
        // If a direct match could not be found pick the task with the smallest distance between
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


        for (const itm of this.cache.lastTrackings) {
            console.info(itm.taskReference);
            if (!itm.taskReference) {
                continue;
            }

            tmpSet.add(itm.taskReference);
            ret.push({
                text: itm.entry.task,
                path: itm.taskReference.path,
                start: undefined,
                last: null
            })

            if (ret.length == amount) {
                return ret;
            }
        }

        if (ret.length < amount) {
            // there are not enough tracked entries in last times so add some new tasks
            const tasks = this.api.pages().file.tasks
                .filter((t: Task) => !tmpSet.has(t))
                .filter((t: Task) => !t.completed);

            let i = 0;

            while (ret.length < amount && tasks.length > i) {
                if (!tmpSet.has(tasks[i].text)) {
                    ret.push({
                        text: tasks[i].text,
                        path: tasks[i].path,
                        start: undefined,
                        last: null,
                    });
                    tmpSet.add(tasks[i].text);
                }

                i++;
            }
        }

        return ret;
    }

    /**
     * Stops tracking of the current active task.
     */
    stopRunningTracking() {
        const runningTaskEntry = this.cache.runningTaskEntry;
        if (!runningTaskEntry) {
            return;
        }

        this.noteService.processFrontMatter(runningTaskEntry.date, (fm: FrontMatterCache) => {
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

    /**
     * Starts tracking a task.
     * 
     * @param taskText Text of the task to start.
     */
    startTracking(taskText: string) {
        this.stopRunningTracking();

        this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache, file: TFile) => {
            if (!(this.FRONT_MATTER_KEY in fm)) {
                fm[this.FRONT_MATTER_KEY] = [];
            }

            const entry: TaskTrackingEntry = {
                task: taskText,
                start: moment().format("HH:mm"),
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