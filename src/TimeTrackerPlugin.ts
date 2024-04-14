import { Plugin } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, TimeTrackerSettings } from './Types/TimeTrackerSettings';
import StatusBarTime from './StatusBarTime';
import CommandHandler from './CommandHandler';

/**
 * Main entry point for obsidian.
 */
export default class TimeTrackerPlugin extends Plugin {
	public settings: TimeTrackerSettings;
	private statusBar: StatusBarTime;
	private commandHandler: CommandHandler;

	/**
	 * Update all view members after changes.
	 */
	updateView() {
		this.statusBar.update();
	}

	async onload() {
		await this.loadSettings();

		this.statusBar = new StatusBarTime(this.app, this);
		this.commandHandler = new CommandHandler(this.app, this);
		this.addSettingTab(new TimeTrackerSettingTab(this.app, this));

		this.commandHandler.register();
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
