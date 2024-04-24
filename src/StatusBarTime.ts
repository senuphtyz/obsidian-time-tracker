import { App, type CachedMetadata, TFile } from "obsidian";
import { findDailyNoteOfToday, isDailyNote } from "./Utils/NoteUtils";
import TimeTrackerPlugin from "./TimeTrackerPlugin";
import { calculateWorkTimeOfFile } from "./Utils/TimeUtils";


export default class StatusBarTime {
    private statusBarItemEl: HTMLElement;

    constructor(
        private app: App,
        private plugin: TimeTrackerPlugin,
    ) {
        this.statusBarItemEl = this.plugin.addStatusBarItem();
        this.registerEvents();
        this.update();
    }

    /**
     * Register events for updates.
     */
    private registerEvents() {
        this.plugin.registerInterval(window.setInterval(() => {
            this.update();
        }, 60 * 1000));

        this.plugin.registerEvent(this.app.metadataCache.on('changed', (file: TFile, data: string, cache: CachedMetadata) => {
            if (!isDailyNote(this.app, file)) {
                return;
            }

            this.update();
        }));
    }

    /**
     * Updates content of statusBar.
     */
    update(file: TFile | null = null) {
        if (file === null) {
            file = findDailyNoteOfToday(this.app);
        }

        const workTime = calculateWorkTimeOfFile(this.app, file, this.plugin.settings);
        this.statusBarItemEl.setText(workTime);
    }
}