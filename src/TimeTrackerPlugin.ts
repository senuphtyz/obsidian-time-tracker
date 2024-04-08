import { App, CachedMetadata, Editor, MarkdownView, MetadataCache, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, TimeTrackerSettings } from './TimeTrackerSettings';

export default class TimeTrackerPlugin extends Plugin {
	settings: TimeTrackerSettings;
	statusBarItemEl: HTMLElement;

	getDailyNoteSettings() {
		const internalPlugins: any = this.app["internalPlugins"];

		const { folder, format, template } =
			internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
		return {
			format: format || "YYYY-MM-DD",
			folder: folder?.trim() || "",
			template: template?.trim() || "",
		};
	}

	findDailyNote() {
		const dailyNoteSettings = this.getDailyNoteSettings();
		return this.app.vault.getFileByPath(dailyNoteSettings.folder + "/" + moment().format(dailyNoteSettings.format) + ".md");
	}

	updateStatusBarTime() {
		this.statusBarItemEl.setText(this.calculateWorkTime());
	}

	calculateWorkTime(): string {
		const dailyNote = this.findDailyNote();

		if (dailyNote === null) {
			return "🕑 No daily Note";
		}

		const frontMatter = this.app.metadataCache.getFileCache(dailyNote)?.frontmatter;

		if (!frontMatter) {
			return "🕑 No frontmatter";
		}

		const work_start = frontMatter[this.settings.property_work_start];
		const pause_start = frontMatter[this.settings.property_pause_start];
		const pause_stop = frontMatter[this.settings.property_pause_end];
		const work_stop = frontMatter[this.settings.property_work_end];

		if (!work_start) {
			return "🕑 Work not started";
		}

		const start = moment.duration(work_start);
		const end = !!work_stop ? moment.duration(work_stop) : moment.duration(moment().format("HH:mm"));
		let diff = end.subtract(start)

		if (!!pause_start && !!pause_stop) {
			diff = diff.subtract(
				moment.duration(pause_stop).subtract(moment.duration(pause_start))
			)
		}

		let f = moment.utc(diff.asMilliseconds()).format("HH:mm");
		return "🕑 " + f;
	}

	async setCurrentTimeToProperty(property: string): Promise<boolean> {
		const dailyNote = this.findDailyNote();

		if (dailyNote === null) {
			return false;
		}

		await this.app.fileManager.processFrontMatter(dailyNote, (fm: any) => {
			let currentTime = moment();
			currentTime = currentTime.seconds(0).minutes(
				currentTime.seconds(0).minutes() - (currentTime.seconds(0).minutes() % 15)
			)
			fm[property] = currentTime.format("HH:mm");
		});

		return true;
	}

	async onload() {
		await this.loadSettings();

		const commands = [
			{ id: 'tt-start-work', name: 'Start work', property: this.settings.property_work_start },
			{ id: 'tt-start-pause', name: 'Start pause', property: this.settings.property_pause_start },
			{ id: 'tt-stop-pause', name: 'Stop pause', property: this.settings.property_pause_end },
			{ id: 'tt-stop-work', name: 'Stop work', property: this.settings.property_work_end }
		];

		for (const x of commands) {
			this.addCommand({
				id: x.id,
				name: `Time Tracker: ${x.name}`,
				callback: async () => {
					await this.setCurrentTimeToProperty(x.property)
					this.updateStatusBarTime();
				}
			});
		}

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.updateStatusBarTime();

		// // This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TimeTrackerSettingTab(this.app, this));

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => {
			this.updateStatusBarTime();
		}, 60 * 1000));

		this.registerEvent(this.app.metadataCache.on('changed', (file: TFile, data: string, cache: CachedMetadata) => {
			if (file != this.findDailyNote()) {
				return;
			}

			this.updateStatusBarTime();
		}));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
