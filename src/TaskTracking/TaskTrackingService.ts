import moment from "moment";
import { Component, type FrontMatterCache, type TAbstractFile, type TFile } from "obsidian";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { isDailyNote } from "../Utils/NoteUtils";
import type { TaskTrackingEntry } from "./Types/TaskTrackingEntry";
import { type DataviewApi } from "obsidian-dataview";
import type { Task } from "./Types/Task";
import { distance } from "fastest-levenshtein";
import type { TaskListEntry } from "./Types/TaskListEntry";
import type { TaskTrackingCache } from "./Cache/TaskTrackingCache";
import type { NoteService } from "../NoteService";
import { ActiveTaskStartedEvent } from "./Event/ActiveTaskStartedEvent";
import { ActiveTaskStoppedEvent } from "./Event/AcitveTaskStoppedEvent";
import { CacheUpdatedEvent } from "./Event/CacheUpdatedEvent";
import type { ReferencedTrackingEntry } from "./Types/ReferencedTrackingEntry";


type LevenshteinMap = { task: Task, distance: number };

export class TaskTrackingService extends Component {
    readonly FRONT_MATTER_KEY = "time_tracking";
    private eventTarget: EventTarget;
    private taskReferenceQueue: Set<ReferencedTrackingEntry>;

    constructor(
        private plugin: TimeTrackerPlugin,
        private cache: TaskTrackingCache,
        private api: DataviewApi,
        private noteService: NoteService
    ) {
        super();
        this.eventTarget = new EventTarget();
        this.taskReferenceQueue = new Set();
    }

    onload(): void {
        this.plugin.registerEvent(this.plugin.app.metadataCache.on('changed', (abstractFile: TAbstractFile) => {
            if (isDailyNote(this.plugin.app, abstractFile)) {
                this.updateCacheForFile(abstractFile);
                this.eventTarget.dispatchEvent(new CacheUpdatedEvent());
            }
        }));

        // @ts-ignore
        this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:index-ready", () => {
            for (const e of this.taskReferenceQueue) {
                e.taskReference = this.findReferencedTask(e.entry);
            }

            this.taskReferenceQueue.clear();
            this.eventTarget.dispatchEvent(new CacheUpdatedEvent());
        }));

        if (!this.plugin.app.workspace.layoutReady) {
            this.plugin.app.workspace.onLayoutReady(async () => this.cacheTrackingData());
        } else {
            this.cacheTrackingData();
        }
    }

    /**
     * Wrapper for addEventListener.
     */
    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        this.eventTarget.addEventListener(type, callback, options);
    }

    /**
     * Wrapper for removeEventListener.
     */
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        this.eventTarget.removeEventListener(type, callback, options);
    }

    private findReferencedTask(taskTrackingEntry: TaskTrackingEntry): Task | null {
        if (!this.api.index.initialized) {
            console.info("Index not ready skip search");
            return null;
        }

        const taskList = this.api.pages().file.tasks.filter((task: Task) => task.text == taskTrackingEntry.task);

        if (taskList.length == 1) {
            console.info("findReferenedTask [FOUND: Direct]", taskTrackingEntry.task);
            return taskList[0];
        }

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
            .map((i: LevenshteinMap) => i.task);

        if (referencedTask.length > 0) {
            console.info("findReferenedTask [FOUND: Levensthein]", taskTrackingEntry.task);
            return referencedTask[0];
        }

        return null;
    }

    private updateCacheForFile(abstractFile: TAbstractFile): boolean {
        const fm = this.plugin.app.metadataCache.getCache(abstractFile.path)?.frontmatter;
        
        if (!fm || !(this.FRONT_MATTER_KEY in fm)) {
            return false;
        }

        const dateString = this.noteService.getDateOfFilePath(abstractFile);
        this.cache.removeFileFromCache(dateString);

        for (const t of (fm[this.FRONT_MATTER_KEY] as TaskTrackingEntry[])) {
            const entry = {
                date: dateString,
                entry: t,
                taskReference: this.findReferencedTask(t)
            };

            if (!this.api.index.initialized) {
                this.taskReferenceQueue.add(entry);
            }

            this.cache.addEntry(entry, abstractFile.path)
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
        let start = moment();
        for (let i = 1; i < days; i++) {
            const file = this.noteService.findFileByDate(start);
            start = start.subtract(1, 'day');

            if (!file) {
                continue;
            }

            this.updateCacheForFile(file);
        }

        this.eventTarget.dispatchEvent(new CacheUpdatedEvent());
    }

    /**
     * Returns a list of tasks that the user might start in the near future.
     *
     * @param amount
     */
    getListOfPreselectedTasks(amount: number = 20): TaskListEntry[] {
        const ret: TaskListEntry[] = [];
        const tmpSet: Set<string> = new Set();

        for (const itm of this.cache.lastTrackings) {
            if (!itm.taskReference) {
                continue
            }

            if (itm.taskReference.completed || tmpSet.has(itm.taskReference.text)) {
                continue
            }

            tmpSet.add( itm.taskReference.text);
            ret.push({
                text: itm.taskReference.text,
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
                .filter((t: Task) => !tmpSet.has(t.text))
                .filter((t: Task) => !t.completed);

            for (let i=0; ret.length < amount && tasks.length > i; i++) {
                if (tmpSet.has(tasks[i].text)) {
                    continue
                }

                ret.push({
                    text: tasks[i].text,
                    path: tasks[i].path,
                    start: undefined,
                    last: null,
                });
                tmpSet.add(tasks[i].text);                
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
            if (!fm[this.FRONT_MATTER_KEY]) {
                return;
            }

            for (const i of fm[this.FRONT_MATTER_KEY]) {
                const itm = (i as TaskTrackingEntry);

                if (itm.task == this.runningTaskEntry?.text && itm.start == this.runningTaskEntry.start?.format('HH:mm')) {
                    itm.end = moment().format('HH:mm')

                    if (itm.start == itm.end) {
                        fm[this.FRONT_MATTER_KEY].splice(fm[this.FRONT_MATTER_KEY].indexOf(itm), 1);
                    }

                    this.cache.clearRunningTaskEntry();
                    this.eventTarget.dispatchEvent(new ActiveTaskStoppedEvent());
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

            this.eventTarget.dispatchEvent(new ActiveTaskStartedEvent(this.runningTaskEntry));
        });
    }
}