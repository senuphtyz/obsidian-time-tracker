import { App, Plugin, WorkspaceLeaf, type PluginManifest } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, type TimeTrackerSettings } from './Types/TimeTrackerSettings';
import StatusBarTime from './StatusBarTime';
import CommandHandler from './CommandHandler';
import { TaskTrackingView, VIEW_TYPE } from './TaskTracking/TaskTrackingView';
import { TaskTrackingService } from './TaskTracking/TaskTrackingService';
import { TaskTrackingCache } from './TaskTracking/Cache/TaskTrackingCache';
import { getAPI } from 'obsidian-dataview';
import { NoteService } from './NoteService';

/**
 * Main entry point for obsidian.
 */
export default class TimeTrackerPlugin extends Plugin {
	public settings: TimeTrackerSettings = DEFAULT_SETTINGS;
	public readonly taskTrackingService: TaskTrackingService;
	public readonly noteService: NoteService;
	private statusBar: StatusBarTime | undefined;
	private commandHandler: CommandHandler | undefined;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.noteService = new NoteService(this);
		this.taskTrackingService = new TaskTrackingService(this, new TaskTrackingCache(), getAPI(app), this.noteService);

		this.taskTrackingService.cacheTrackingData();
	}

	/**
	 * Update all view members after changes.
	 */
	updateView() {
		this.statusBar?.update();
	}

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, (leaf) => new TaskTrackingView(leaf, this));
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
