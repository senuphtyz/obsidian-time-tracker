import { App, FrontMatterCache, TFile, moment } from "obsidian";
import DailyNoteSettings from "./Types/DailyNoteSettings";

/**
 * Get settings of daily note plugin.
 */
export function getDailyNoteSettings(app: App): DailyNoteSettings {
    // @ts-ignore
    const internalPlugins: any = app["internalPlugins"];

    const { folder, format, template } =
        internalPlugins.getPluginById("daily-notes")?.instance?.options || {};

    return {
        format: format || "YYYY-MM-DD",
        folder: folder?.trim() || "",
        template: template?.trim() || "",
    };
}


/**
 * Returns true if given note is a daily note.
 * 
 * @param note Note to check.
 * @returns True if name matches format configuration of daily note plugin.
 */
export function isDailyNote(app: App, note: TFile): boolean {
    const settings = getDailyNoteSettings(app);
    const dt = moment(note.basename.replace(note.extension, ''), settings.format);

    return dt.format(settings.format) == note.basename;
}

/**
 * Return daily note of today.
 * 
 * @param app 
 * @returns
 */
export function findDailyNoteOfToday(app: App): TFile | null {
    const dailyNoteSettings = getDailyNoteSettings(app);
    return app.vault.getFileByPath(dailyNoteSettings.folder + "/" + moment().format(dailyNoteSettings.format) + ".md");
}

/**
 * Returns frontMatter of given file.
 * 
 * @param app 
 * @param file 
 * @returns 
 */
export function getFrontMatter(app: App, file: TFile): FrontMatterCache {
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;

    if (!fm) {
        throw new Error(`No Frontmatter available for given file [${file.path}]`)
    }

    return fm;
}
