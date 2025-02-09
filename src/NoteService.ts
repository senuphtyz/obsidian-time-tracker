import { moment, type FrontMatterCache, type TAbstractFile, type TFile } from "obsidian";
import type TimeTrackerPlugin from "./TimeTrackerPlugin";
import type { Moment } from "moment";
import { DailyNoteMissingException } from "./Exception";

export type ProcessFrontMatterFn<T> = (fm: FrontMatterCache, file: TFile) => T;

export interface DailyNoteSettings {
  format: string;
  folder: string;
  template: string;
}

export class NoteService {
  constructor(private plugin: TimeTrackerPlugin) {
  }

  /**
   * Returns the daily note plugin settings.
   */
  get dailyNoteSettings(): DailyNoteSettings {
    // @ts-ignore
    const internalPlugins = this.plugin.app["internalPlugins"];

    const { folder, format, template } =
      internalPlugins.getPluginById("daily-notes")?.instance?.options || {};

    return {
      format: format || "YYYY-MM-DD",
      folder: folder?.trim() || "",
      template: template?.trim() || "",
    };
  }

  /**
   * Find a daily note by its date.
   * 
   * @param date 
   * @returns 
   */
  findFileByDate(date: string | Moment): TFile | null {
    const s = this.dailyNoteSettings;

    if (typeof (date) != "string") {
      date = date.format(s.format);
    }

    return this.plugin.app.vault.getFileByPath(`${s.folder}/${date}.md`);
  }

  /**
   * Returns date of the given daily note file.
   * 
   * @param file 
   * @returns 
   */
  getDateOfFilePath(file: TAbstractFile): string {
    const s = this.dailyNoteSettings;
    return moment(file.name, s.format).format("YYYY-MM-DD");
  }

  /**
   * Process the frontMatter of the daily note file for the given date.
   * 
   * @param date Date to look for a daily note. 
   * @param fn Callback function
   */
  processFrontMatter<T>(date: string | Moment | undefined, fn: ProcessFrontMatterFn<T>): Promise<T> {
    if (date == undefined) {
      date = moment()
    }

    const file = this.findFileByDate(date);
    if (file === null) {
      throw new DailyNoteMissingException();
    }

    let ret: T;

    return this.plugin.app.fileManager.processFrontMatter(file, (fm) => { ret = fn(fm, file) }).then(() => {
      return ret;
    })
  }
}