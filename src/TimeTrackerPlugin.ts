import { Plugin, moment } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, TimeTrackerSettings } from './Types/TimeTrackerSettings';
import MobaTimeClient from './MobaTimeClient/MobaTimeClient';
import StatusBarTime from './StatusBarTime';
import { findDailyNoteOfToday } from './NoteUtils';

/**
 * Main entry point for obsidian.
 */
export default class TimeTrackerPlugin extends Plugin {
	public settings: TimeTrackerSettings;
	private statusBar: StatusBarTime;

	async setCurrentTimeToProperty(property: string): Promise<boolean> {
		const dailyNote = findDailyNoteOfToday(this.app);

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
		this.statusBar = new StatusBarTime(this.app, this);


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
					this.statusBar.update();
				}
			});
		}

		this.addCommand({
			id: "tt-sync-day",
			name: "Time Tracker: Sync current day",
			callback: async () => {
				const client = new MobaTimeClient(this.app, this.settings);
				const dailyNote = findDailyNoteOfToday(this.app);

				if (dailyNote) {
					client.synchronize(dailyNote);
				}
			}
		})

		// // This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TimeTrackerSettingTab(this.app, this));
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
