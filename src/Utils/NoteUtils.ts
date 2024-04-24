import { App, type FrontMatterCache, TFile } from "obsidian";
import type DailyNoteSettings from "../Types/DailyNoteSettings";
import moment from "moment";

/**
 * Get settings of daily note plugin.
 */
export function getDailyNoteSettings(app: App): DailyNoteSettings {
    // @ts-ignore
    const internalPlugins = app["internalPlugins"];

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
 * @param file Note to check.
 * @returns True if name matches format configuration of daily note plugin.
 */
export function isDailyNote(app: App, file: TFile): boolean {
    const settings = getDailyNoteSettings(app);
    const dt = moment(file.basename.replace(file.extension, ''), settings.format);

    return dt.format(settings.format) == file.basename;
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

/**
 * Set a property of a daily note to current time.
 * 
 * @param app 
 * @param property 
 * @returns 
 */
export async function setCurrentTimeToProperty(app: App, property: string): Promise<boolean> {
    const dailyNote = findDailyNoteOfToday(app);

    if (dailyNote === null) {
        return false;
    }

    await app.fileManager.processFrontMatter(dailyNote, (fm: FrontMatterCache) => {
        let currentTime = moment();
        currentTime = currentTime.seconds(0).minutes(
            currentTime.seconds(0).minutes() - (currentTime.seconds(0).minutes() % 15)
        )
        fm[property] = currentTime.format("HH:mm");
    });

    return true;
}