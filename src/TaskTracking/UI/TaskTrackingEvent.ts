import type { TaskListEntry } from "../Types/TaskListEntry";

export enum State {
    STOPPED = 0,
    TRACKING = 1
}

export interface TaskTrackingEvent<T = unknown> {
    task: TaskListEntry;
    currentState: State;
    payload?: T
}