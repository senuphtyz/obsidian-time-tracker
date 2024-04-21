import type { Task } from "./Task";

export enum State {
    STOPPED = 0,
    TRACKING = 1
}

export interface TaskTrackingEvent<T = any> {
    task: Task;
    currentState: State;
    payload?: T
}