import type { ReferencedTrackingEntry } from "./ReferencedTrackingEntry";
import moment from "moment";

export interface TaskTrackingCacheItem {
    file: string;
    entries: ReferencedTrackingEntry[];
}

export interface TaskTrackingCache {
    [date: string]: TaskTrackingCacheItem;
}


export class BackInTimeIterator implements Iterator<ReferencedTrackingEntry> {
    private current: { date: string | null, idx: number };
    private keys: string[];
    private data: TaskTrackingCache;

    constructor(data: TaskTrackingCache) {
        this.data = data
        this.keys = Object.keys(this.data).sort((a: string, b: string) => moment(a, 'YYYY-MM-DD').isBefore(moment(b, 'YYYY-MM-DD')) ? -1 : 1);
        this.current = { date: null, idx: 0 };
    }

    next(): IteratorResult<ReferencedTrackingEntry, null> {
        if (this.current.date === null) {
            this.current.date = this.keys[0];
            this.keys = this.keys.slice(1);
            this.current.idx = 0;
        }

        if (this.current.idx < this.data[this.current.date].entries.length) {
            return {
                value: this.data[this.current.date].entries[this.current.idx++]
            }
        } else {
            while (this.keys.length > 0) {
                this.current.date = this.keys[0];
                this.current.idx = 0;
                this.keys = this.keys.slice(1);

                if (this.current.idx < this.data[this.current.date].entries.length) {
                    return {
                        value: this.data[this.current.date].entries[this.current.idx++]
                    }
                }
            }
        }

        return {
            done: true,
            value: null
        }
    }
}