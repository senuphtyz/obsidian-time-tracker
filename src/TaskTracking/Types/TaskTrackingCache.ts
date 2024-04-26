import type { ReferencedTrackingEntry } from "./ReferencedTrackingEntry";
import moment from "moment";

export interface TaskTrackingCacheItem {
    file: string;
    entries: ReferencedTrackingEntry[];
}

export interface TaskTrackingCache {
    [date: string]: TaskTrackingCacheItem;
}

export interface DateReferencedTrackingEntry extends ReferencedTrackingEntry {
    date: string;
}


export class BackInTimeIterator implements Iterator<DateReferencedTrackingEntry> {
    private current: { date: string | null, idx: number };
    private keys: string[];
    private data: TaskTrackingCache;

    constructor(data: TaskTrackingCache) {
        this.data = data
        this.keys = Object.keys(this.data).sort((a: string, b: string) => {
            return moment(a, 'YYYY-MM-DD').isBefore(moment(b, 'YYYY-MM-DD')) ? -1 : 1;
        });
        this.current = { date: null, idx: 0 };
    }

    next(): IteratorResult<DateReferencedTrackingEntry, null> {
        if (this.current.date === null) {
            this.current.date = this.keys[0];
            this.keys = this.keys.slice(1);
            this.current.idx = 0;
        }

        if (this.current.idx < this.data[this.current.date].entries.length) {
            const ret = Object.assign({}, this.data[this.current.date].entries[this.current.idx++], { date: this.current.date });

            return { value: ret }
        } else {
            while (this.keys.length > 0) {
                this.current.date = this.keys[0];
                this.current.idx = 0;
                this.keys = this.keys.slice(1);

                if (this.current.idx < this.data[this.current.date].entries.length) {
                    const ret = Object.assign({}, this.data[this.current.date].entries[this.current.idx++], { date: this.current.date });
                    return { value: ret }
                }
            }
        }

        return {
            done: true,
            value: null
        }
    }
}