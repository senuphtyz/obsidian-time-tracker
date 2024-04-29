import moment from "moment";
import type { TaskTrackingCacheItem } from "../Types/TaskTrackingCacheItem";
import type { ReferencedTrackingEntry } from "../Types/ReferencedTrackingEntry";

export class BackInTimeIterator implements Iterator<ReferencedTrackingEntry> {
    private current: { date: string | null, idx: number };
    private keys: string[];
    private data: Map<string, TaskTrackingCacheItem>;

    constructor(data: Map<string, TaskTrackingCacheItem>) {
        this.data = data
        this.keys = Array.from(this.data.keys()).sort((a: string, b: string) => {
            return moment(a, 'YYYY-MM-DD').isBefore(moment(b, 'YYYY-MM-DD')) ? -1 : 1;
        });
        this.current = { date: null, idx: 0 };
    }

    next(): IteratorResult<ReferencedTrackingEntry, null> {
        if (this.current.date === null) {
            this.current.date = this.keys[0];
            this.keys = this.keys.slice(1);
            this.current.idx = 0;
        }

        const entries = this.data.get(this.current.date)?.entries;
        if (!entries) {
            return { done: true, value: null }
        }

        if (this.current.idx < entries.length) {
            const ret = Object.assign({}, entries[this.current.idx++], { date: this.current.date });

            return { value: ret }
        } else {
            while (this.keys.length > 0) {
                this.current.date = this.keys[0];
                this.current.idx = 0;
                this.keys = this.keys.slice(1);

                if (this.current.idx < entries.length) {
                    const ret = Object.assign({}, entries[this.current.idx++], { date: this.current.date });
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