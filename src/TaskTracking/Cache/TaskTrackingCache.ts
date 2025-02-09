import type { TaskTrackingCacheItem } from "../Types/TaskTrackingCacheItem";
import type { ReferencedTrackingEntry } from "../Types/ReferencedTrackingEntry";
import { BackInTimeIterator } from "./BackInTimeIterator";
import { Component, moment } from "obsidian";

export class TaskTrackingCache extends Component implements Iterable<ReferencedTrackingEntry> {
  private _data: Map<string, TaskTrackingCacheItem>;
  private _runningTaskEntry: ReferencedTrackingEntry | undefined;
  private _lastTrackingEntry: Map<string, ReferencedTrackingEntry>;

  constructor() {
    super();

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
   * Returns a set of TaskTrackingCacheItems that have tasks referencing to cached daily note files.
   *
   * @param file File to search in
   */
  findTasksInFile(file: string): Set<TaskTrackingCacheItem> {
    const result = new Set<TaskTrackingCacheItem>();

    for (const trackingCacheItem of this._data.values()) {
      for (const e of trackingCacheItem.entries) {
        if (e.taskReference?.path === file) {
          result.add(trackingCacheItem);
          break;
        }
      }
    }

    return result;
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
   * List of files that have task entries.
   */
  get files(): Set<string> {
    return new Set(this._data.keys());
  }

  /**
   * Remove caching for a given file.
   * 
   * @param file Filepath of the file to remove from cache.
   */
  removeFileFromCache(date: string) {
    const rt = this._runningTaskEntry;

    // Check if current running task is part of the changed file
    if (rt && rt.date == date) {
      const entries = this._data.get(date)?.entries ?? [];
      for (const e of entries) {
        if (e.entry == rt.entry) {
          this._runningTaskEntry = undefined;
        }
      }
    }

    this._data.delete(date);
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

      // Check if current running task has updated and unset if end time has changed
      if (this._runningTaskEntry && this._runningTaskEntry.entry.task == value.entry.task) {
        if (value.date == this._runningTaskEntry.date && value.entry.start != "" && value.entry.end != "") {
          this._runningTaskEntry = undefined;
        }
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