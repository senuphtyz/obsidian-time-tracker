import type { Task } from "./Task";
import type { TaskTrackingEntry } from "./TaskTrackingEntry";

export interface ReferencedTrackingEntry {
    taskReference: Task | null;
    entry: TaskTrackingEntry;
}