import moment from "moment";
import type { TAbstractFile } from "obsidian";
import type TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { getDailyNoteSettings, isDailyNote } from "src/Utils/NoteUtils";
import type { TaskTrackingEntry } from "./Types/TaskTrackingEntry";
import { getAPI, type DataviewApi } from "obsidian-dataview";
import type { Task } from "./Types/Task";
import { distance } from "fastest-levenshtein";
import type { LastTimeTrack, TaskListEntry } from "./Types/TaskListEntry";
import { BackInTimeIterator, type TaskTrackingCache } from "./Types/TaskTrackingCache";
import path from "path";


type LevenshteinMap = { task: Task, distance: number };

export class TaskTrackingService {
    readonly FRONT_MATTER_KEY = "time_tracking";
    api: DataviewApi;
    cache: TaskTrackingCache = {};
    currentActiveTaskTracking: TaskListEntry | undefined;


    constructor(private plugin: TimeTrackerPlugin) {
        this.api = getAPI(plugin.app);

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
                referencedTask = this.findReferencedTask(t);
            }

            this.cache[dateString].entries.push({
                entry: t,
                taskReference: referencedTask,
            });
        }

        return true;
    }

    findLastTracked(taskText: string): LastTimeTrack | null {
        const it = new BackInTimeIterator(this.cache);

        let running = true;
        while (running) {
            const itm = it.next();

            if (itm.value?.entry.task == taskText && itm.value?.entry.end != "") {
                return {
                    start: moment(`${itm.value.date} ${itm.value.entry.start}`, 'YYYY-MM-DD HH:mm'),
                    end: moment(`${itm.value.date} ${itm.value.entry.end}`, 'YYYY-MM-DD HH:mm'),
                }
            }

            running = !itm.done
        }

        return null;
    }


    get runningTaskEntry(): TaskListEntry | undefined {
        if (this.currentActiveTaskTracking) {
            return this.currentActiveTaskTracking;
        }

        const today = moment().format("YYYY-MM-DD");

        if (!this.cache[today]) {
            return;
        }

        const ret = this.cache[today].entries
            .filter(e => e.entry.start != "" && e.entry.end == "")
            .map(e => {
                return {
                    text: e.entry.task,
                    path: this.cache[today].file,
                    start: moment(`${today} ${e.entry.start}`, "YYYY-MM-DD HH:mm"),
                    last: null
                }
            }).first();

        if (ret) {
            // @ts-ignore
            ret.last = this.findLastTracked(ret.text);
        }

        this.currentActiveTaskTracking = ret;
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

    stopRunningTracking() {
        if (!this.runningTaskEntry) {
            return;
        }

        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${moment().format(dailyNoteSettings.format)}.md`);
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

                    this.currentActiveTaskTracking = undefined;
                    return;
                }
            }
        });
    }

    startTracking(taskText: string, filePath: string) {

        if (this.currentActiveTaskTracking) {
            this.stopRunningTracking();
        }

        const dailyNoteSettings = getDailyNoteSettings(this.plugin.app);

        const file = this.plugin.app.vault.getFileByPath(`${dailyNoteSettings.folder}/${moment().format(dailyNoteSettings.format)}.md`);
        if (!file) {
            return;
        }

        this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
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
            this.currentActiveTaskTracking = {
                text: taskText,
                start: now,
                path: filePath,
                last: this.findLastTracked(taskText),
            };
        });
    }
}