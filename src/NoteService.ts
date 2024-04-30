import type { FrontMatterCache, TFile } from "obsidian";
import type TimeTrackerPlugin from "./TimeTrackerPlugin";
import type { Moment } from "moment";
import moment from "moment";
import { DailyNotMissingException } from "./Exception";

export type ProcessFrontMatterFn = (fm: FrontMatterCache, file: TFile) => void;

export interface DailyNoteSettings {
    format: string;
    folder: string;
    template: string;
}

export class NoteService {
    private _dailyNoteSettings: DailyNoteSettings | undefined;

    constructor(private plugin: TimeTrackerPlugin) {
        this._dailyNoteSettings = undefined;
    }

    private getFileForDate(date: string | Moment | undefined): TFile | null {
        if (!date) {
            date = moment();
        } else if (typeof (date) == 'string') {
            date = moment(date, 'YYYY-MM-DD');
        }

        return this.plugin.app.vault.getFileByPath(
            `${this.dailyNoteSettings.folder}/${date.format(this.dailyNoteSettings.format)}.md`
        )
    }

    get dailyNoteSettings(): DailyNoteSettings {
        if (!this._dailyNoteSettings) {
            // @ts-ignore
            const internalPlugins = this.plugin.app["internalPlugins"];

            const { folder, format, template } =
                internalPlugins.getPluginById("daily-notes")?.instance?.options || {};

            this._dailyNoteSettings = {
                format: format || "YYYY-MM-DD",
                folder: folder?.trim() || "",
                template: template?.trim() || "",
            };
        }

        return this._dailyNoteSettings;
    }

    /**
     * Process the frontMatter of the daily note file for the given date.
     * 
     * @param date Date to look for a daily note. 
     * @param fn Callback function
     */
    processFrontMatter(date: string | Moment | undefined, fn: ProcessFrontMatterFn) {
        const file = this.getFileForDate(date);
        if (file === null) {
            throw new DailyNotMissingException();
        }

        this.plugin.app.fileManager.processFrontMatter(file, (fm) => { fn(fm, file) });
    }
}