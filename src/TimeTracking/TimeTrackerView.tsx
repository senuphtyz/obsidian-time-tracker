import { ItemView, WorkspaceLeaf } from "obsidian";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { StrictMode } from "react";
import { Root, createRoot } from 'react-dom/client';
import { AppContext, AppContextValue } from "src/Common/UI/Contexts";
import { TimeTracker } from "./UI/TimeTracker";
import { TrackerStateUpdateEvent } from "./Event/TrackerStateUpdateEvent";
import { TrackerState } from "./Types/TrackerState";
import { monthTimeStore, stateStore, timeStore, weekTimeStore } from "./UI/Stores";
import { TrackerTimeUpdateEvent } from "./Event/TrackerTimeUpdateEvent";
import moment from "moment";

export const VIEW_TYPE = "time-tracker-time-tracker-view";

export class TimeTrackerView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
    super(leaf);

    this.plugin.timeTrackingService.addEventListener(TrackerStateUpdateEvent.EVENT_NAME, (e: TrackerStateUpdateEvent) => this.updateState(e));
    this.plugin.timeTrackingService.addEventListener(TrackerTimeUpdateEvent.EVENT_NAME, (e: TrackerTimeUpdateEvent) => this.updateTime(e));

    this.root = createRoot(this.containerEl.children[1]);
  }

  private updateTime(event: TrackerTimeUpdateEvent): void {
    timeStore.setValue(event.time);

    this.plugin.timeTrackingService.getDurationBetweenDates(moment().startOf('month'), moment()).then((value) => {
      monthTimeStore.setValue(value);
    });

    this.plugin.timeTrackingService.getDurationBetweenDates(moment().startOf('week'), moment()).then((value) => {
      weekTimeStore.setValue(value);
    });
  }

  /**
   * Updates the state of the time tracker in ui components.
   * 
   * @param event The event that contains the new state of the time tracker
   */
  private updateState(event: TrackerStateUpdateEvent): void {
    if (event.newState === undefined) {
      stateStore.setValue(TrackerState.NOT_RUNNING);
      return;
    }

    stateStore.setValue(event.newState);

    if (event.newState == TrackerState.PAUSE_STARTED) {
      this.plugin.taskTrackingService.stopRunningTracking(true);
    } else if (event.oldState == TrackerState.PAUSE_STARTED && (event.newState == TrackerState.STARTED || event.newState == TrackerState.PAUSE_STOPPED)) {
      this.plugin.taskTrackingService.resumeTracking();
    } else if (event.newState == TrackerState.STOPPED) {
      this.plugin.taskTrackingService.stopRunningTracking(false);
    }
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Time Tracker: Time tracking";
  }

  onEvent(): void {
    this.plugin.timeTrackingService.storeTime();
  }

  onStopDay(): void {
    this.plugin.timeTrackingService.stopDay();
  }

  async onOpen(): Promise<void> {
    const appContext: AppContextValue = {
      settings: this.plugin.settings,
      view: this,
    }

    this.root?.render(
      <StrictMode>
        <AppContext.Provider value={appContext}>
          <TimeTracker onClick={() => this.onEvent()} onStopDay={() => this.onStopDay()} />
        </AppContext.Provider>
      </StrictMode>
    )
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.plugin.timeTrackingService.removeEventListener(TrackerStateUpdateEvent.EVENT_NAME, this.updateState);
  }
}