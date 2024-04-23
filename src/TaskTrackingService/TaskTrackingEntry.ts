

export interface TaskTrackingEntry {
    task: string;
    start: string;
    end: string;
    payload: { [k: string]: unknown; };
}