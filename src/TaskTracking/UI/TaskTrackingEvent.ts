import type { Task } from "../Types/Task";

export enum State {
    STOPPED = 0,
    TRACKING = 1
}

export interface TaskTrackingEvent<T = unknown> {
    task: Task;
    currentState: State;
    payload?: T
}