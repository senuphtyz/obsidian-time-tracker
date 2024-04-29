import type { Task } from "./Task";
import type { TaskTrackingEntry } from "./TaskTrackingEntry";

export interface ReferencedTrackingEntry {
    date: string;
    taskReference: Task | null;
    entry: TaskTrackingEntry;
}