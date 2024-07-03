import localforage from "localforage";

export class LocalStorageCache {
    private persister: LocalForage;

    constructor(appId: string, version: string) {
        this.persister = localforage.createInstance({
            name: "time-tracker/cache/" + appId,
            driver: [localforage.INDEXEDDB],
            description: "Cache metadata about daily notes"
        })
    }

    loadFile(path: string) {
        return this.persister.getItem(path);
    }
}