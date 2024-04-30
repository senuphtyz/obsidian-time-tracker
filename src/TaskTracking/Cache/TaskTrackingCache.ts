import moment from "moment";
import type { TaskTrackingCacheItem } from "../Types/TaskTrackingCacheItem";
import type { ReferencedTrackingEntry } from "../Types/ReferencedTrackingEntry";
import { BackInTimeIterator } from "./BackInTimeIterator";

export class TaskTrackingCache implements Iterable<ReferencedTrackingEntry> {
    private _data: Map<string, TaskTrackingCacheItem>;
    private _runningTaskEntry: ReferencedTrackingEntry | undefined;
    private _lastTrackingEntry: Map<string, ReferencedTrackingEntry>;

    constructor() {
        this._data = new Map();
        this._runningTaskEntry = undefined;
        this._lastTrackingEntry = new Map();
    }

    /**
     * Default iterator.
     * 
     * @returns Iterator
     */
    [Symbol.iterator](): Iterator<ReferencedTrackingEntry, unknown, undefined> {
        return new BackInTimeIterator(this._data);
    }

    get length(): number {
        return Array.from(this).length;
    }

    /**
     * Returns the last tracking entry for the given task.
     * 
     * @param taskName Name of task
     * @returns 
     */
    getLastTrack(taskName: string): ReferencedTrackingEntry | undefined {
        return this._lastTrackingEntry.get(taskName);
    }

    /**
     * List of last trackings sorted by datetime desc.
     */
    get lastTrackings(): ReferencedTrackingEntry[] {
        return Array
            .from(this._lastTrackingEntry.values())
            .map(v => { return { "dd": moment(`${v.date} ${v.entry.start}`, 'YYYY-MM-DD HH:mm'), "v": v } })
            .sort((a, b) => {
                return a.dd.isBefore(b.dd) ? -1 : 1;
            })
            .map(v => v.v)
            .reverse()
        ;
    }

    /**
     * Adds an entry to the cache.
     * 
     * @param value Tracking entry to add
     * @param file Filepath of the file containg the entry
     */
    addEntry(value: ReferencedTrackingEntry, file: string) {
        if (!this._data.has(value.date)) {
            this._data.set(value.date, {
                file: file,
                entries: []
            })
        }

        if (value.entry.start != "" && value.entry.end == "") {
            // Found current running task
            this._runningTaskEntry = value;
        } else {
            // If its not a running task we can use it to check if this might be
            // the tracking element on iteration before
            let updateLast = !this._lastTrackingEntry.has(value.entry.task);
            updateLast ||= moment(value.date, 'YYYY-MM-DD').isAfter(
                moment(this._lastTrackingEntry.get(value.entry.task)?.date, 'YYYY-MM-DD')
            );

            if (updateLast) {
                this._lastTrackingEntry.set(value.entry.task, value);
            }

        }

        this._data.get(value.date)?.entries.push(value);
    }

    /**
     * Check if at least one entry is available for given date.
     * 
     * @param date Datestring in format YYYY-MM-DD.
     * @returns True if at least one entry exists otherwise false.
     */
    hasDate(date: string): boolean {
        return this._data.has(date);
    }

    /**
     * Returns current running tracking entry or undefined.
     */
    get runningTaskEntry(): ReferencedTrackingEntry | undefined {
        return this._runningTaskEntry;
    }

    /**
     * Resets current running trask entry.
     */
    clearRunningTaskEntry() {
        if (this._runningTaskEntry) {
            // Since the running task has stopped we can use it as last tracking entry
            // for the task.
            this._lastTrackingEntry.set(this._runningTaskEntry.entry.task, this._runningTaskEntry);
        }
        this._runningTaskEntry = undefined;
    }

    /**
     * Return RefrenceTrackEntries in historical order.
     */
    get entries(): ReferencedTrackingEntry[] {
        return Array.from(this);
    }
}