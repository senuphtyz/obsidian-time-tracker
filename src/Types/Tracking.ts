export type Tracking = TrackingItem[];

export interface TrackingItem {
    task: string;
    start: string;
    stop: string;
    payload: object;
}