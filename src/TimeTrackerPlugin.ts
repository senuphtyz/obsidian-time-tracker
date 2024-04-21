import { Plugin, WorkspaceLeaf } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, TimeTrackerSettings } from './Types/TimeTrackerSettings';
import StatusBarTime from './StatusBarTime';
import CommandHandler from './CommandHandler';
import { TaskTrackingView, VIEW_TYPE } from './TaskTrackingView';

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

		this.registerView(VIEW_TYPE, (leaf) => new TaskTrackingView(leaf));
		this.statusBar = new StatusBarTime(this.app, this);
		this.commandHandler = new CommandHandler(this.app, this);
		this.addSettingTab(new TimeTrackerSettingTab(this.app, this));

		this.commandHandler.register();
		this.addRibbonIcon("dice", "Activate view", () => {
			this.activateView();
		});		
	}

	onunload() {
	}

	async activateView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		let leaf: WorkspaceLeaf | null = null;

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				return;
			}
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
