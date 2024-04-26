import type { Moment } from "moment";

export interface LastTimeTrack {
    start: Moment;
    end: Moment;
}

export interface TaskListEntry {
    text: string;
    path: string;
    start: Moment | undefined;
    last: LastTimeTrack | null;
}