import type { ReferencedTrackingEntry } from "./ReferencedTrackingEntry";

export interface TaskTrackingCacheItem {
    file: string;
    entries: ReferencedTrackingEntry[];
}
