import { App, Plugin, WorkspaceLeaf, type PluginManifest } from 'obsidian';
import TimeTrackerSettingTab from "./TimeTrackerSettingTab";
import { DEFAULT_SETTINGS, type TimeTrackerSettings } from './Types/TimeTrackerSettings';
import StatusBarTime from './StatusBarTime';
import CommandHandler from './CommandHandler';
import { TaskTrackingView, VIEW_TYPE as TaskTrackingViewType } from './TaskTracking/TaskTrackingView';
import { TimeTrackerView, VIEW_TYPE as TimeTrackerViewType } from './TimeTracking/TimeTrackerView';
import { TaskTrackingService } from './TaskTracking/TaskTrackingService';
import { TaskTrackingCache } from './TaskTracking/Cache/TaskTrackingCache';
import { getAPI } from 'obsidian-dataview';
import { NoteService } from './NoteService';
import { TimeTrackerService } from './TimeTracking/TimeTrackerService';

/**
 * Main entry point for obsidian.
 */
export default class TimeTrackerPlugin extends Plugin {
  public settings: TimeTrackerSettings = DEFAULT_SETTINGS;
  public readonly taskTrackingService: TaskTrackingService;
  public readonly timeTrackingService: TimeTrackerService;
  public readonly noteService: NoteService;
  private cache: TaskTrackingCache;
  private statusBar: StatusBarTime | undefined;
  private commandHandler: CommandHandler | undefined;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    this.noteService = new NoteService(this);
    this.cache = new TaskTrackingCache();
    const dataviewApi = getAPI(app);
    this.taskTrackingService = new TaskTrackingService(this, this.cache, dataviewApi, this.noteService);
    this.timeTrackingService = new TimeTrackerService(this, dataviewApi, this.noteService);

    this.addChild(this.cache);
    this.addChild(this.taskTrackingService);
    this.addChild(this.timeTrackingService);
  }

  /**
   * Update all view members after changes.
   */
  updateView() {
    this.statusBar?.update();
  }

  async onload() {
    await this.loadSettings();

    this.registerView(TaskTrackingViewType, (leaf) => new TaskTrackingView(leaf, this));
    this.registerView(TimeTrackerViewType, (leaf) => new TimeTrackerView(leaf, this));

    this.statusBar = new StatusBarTime(this.app, this);
    this.commandHandler = new CommandHandler(this.app, this);
    this.addSettingTab(new TimeTrackerSettingTab(this.app, this));

    this.commandHandler.register();
    this.addRibbonIcon("dice", "Show task tracker view", () => {
      this.activateView(TaskTrackingViewType);
    });

    this.addRibbonIcon("clock", "Show time tracker view", () => {
      this.activateView(TimeTrackerViewType);
    });
  }

  onunload() {
  }

  async activateView(type: string) {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(type);
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
      await leaf.setViewState({ type: type, active: true });
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
