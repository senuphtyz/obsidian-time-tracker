import { ItemView, WorkspaceLeaf } from "obsidian";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { StrictMode } from "react";
import { Root, createRoot } from 'react-dom/client';
import { AppContext, AppContextValue } from "src/Common/UI/Contexts";
import { TimeTracker } from "./UI/TimeTracker";

export const VIEW_TYPE = "time-tracker-time-tracker-view";

export class TimeTrackerView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
    super(leaf);

    // this.plugin.taskTrackingService.addEventListener(ActiveTaskStartedEvent.EVENT_NAME, (evt: Event) => {
    //   const e: ActiveTaskStartedEvent = (evt as ActiveTaskStartedEvent);
    //   runningTaskStore.setValue(e.task);
    // });

    // this.plugin.taskTrackingService.addEventListener(ActiveTaskStoppedEvent.EVENT_NAME, (evt: Event) => {
    //   runningTaskStore.setValue(undefined);
    // });

    // this.plugin.taskTrackingService.addEventListener(CacheUpdatedEvent.EVENT_NAME, (evt: Event) => {
    //   runningTaskStore.setValue(this.plugin.taskTrackingService.runningTaskEntry);
    //   taskStore.setValue(this.plugin.taskTrackingService.getListOfPreselectedTasks());
    // });

    // // @ts-ignore
    // this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:metadata-change", () => {
    //   runningTaskStore.setValue(this.plugin.taskTrackingService.runningTaskEntry);
    //   taskStore.setValue(this.plugin.taskTrackingService.getListOfPreselectedTasks());
    // }));

    this.root = createRoot(this.containerEl.children[1]);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Time Tracker: Time tracking";
  }

  onEvent(): void {
    console.log("TimeTrackerView event", event);
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
  }
}