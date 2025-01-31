import { App } from "obsidian";
import TimeTrackerPlugin from "./TimeTrackerPlugin";
import { TrackerTimeUpdateEvent } from "./TimeTracking/Event/TrackerTimeUpdateEvent";
import { TrackerStateUpdateEvent } from "./TimeTracking/Event/TrackerStateUpdateEvent";
import { TrackerState } from "./TimeTracking/Types/TrackerState";


export default class StatusBarTime {
  private statusBarItemEl: HTMLElement;
  private updateTime: boolean;

  constructor(
    private app: App,
    private plugin: TimeTrackerPlugin,
  ) {
    this.updateTime = false;
    this.statusBarItemEl = this.plugin.addStatusBarItem();
    this.registerEvents();
  }

  /**
   * Register events for updates.
   */
  private registerEvents() {
    this.plugin.timeTrackingService.addEventListener(TrackerTimeUpdateEvent.EVENT_NAME, (event: TrackerTimeUpdateEvent) => {
      if (!this.updateTime) {
        return;
      }

      this.statusBarItemEl.setText(`🕑 ${event.time}`);
    });

    this.plugin.timeTrackingService.addEventListener(TrackerStateUpdateEvent.EVENT_NAME, (event: TrackerStateUpdateEvent) => {
      switch (event.newState) {
        case undefined:
          this.statusBarItemEl.setText("🕑 No daily Note");
          break;
        case TrackerState.NOT_RUNNING:
          this.statusBarItemEl.setText("🕑 Work not started");
          break;
        default:
          this.updateTime = true;
          break;
      }
    });
  }
}