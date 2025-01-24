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

  private updateState(event: TrackerStateUpdateEvent): void {
    if (event.newState === undefined) {
      stateStore.setValue(TrackerState.NOT_RUNNING);
      return;
    }

    stateStore.setValue(event.newState);
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

  async onOpen(): Promise<void> {
    const appContext: AppContextValue = {
      settings: this.plugin.settings,
      view: this,
    }

    this.root?.render(
      <StrictMode>
        <AppContext.Provider value={appContext}>
          <TimeTracker onClick={() => this.onEvent()} />
        </AppContext.Provider>
      </StrictMode>
    )
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.plugin.timeTrackingService.removeEventListener(TrackerStateUpdateEvent.EVENT_NAME, this.updateState);
  }
}