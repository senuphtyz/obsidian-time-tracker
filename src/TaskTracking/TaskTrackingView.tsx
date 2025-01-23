import { ItemView, WorkspaceLeaf } from "obsidian";
import { TaskListComponent } from "./UI/TaskListComponent";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { StrictMode } from "react";
import { Root, createRoot } from 'react-dom/client';
import { CacheUpdatedEvent } from "./Event/CacheUpdatedEvent";
import { AppContext, AppContextValue } from "../Common/UI/Contexts";
import { runningTaskStore, taskStore } from "./UI/Stores";
import { ActiveTaskStartedEvent } from "./Event/ActiveTaskStartedEvent";
import { ActiveTaskStoppedEvent } from "./Event/AcitveTaskStoppedEvent";
import { TaskListEntry } from "./Types/TaskListEntry";

export const VIEW_TYPE = "time-tracker-task-tracking-view";

export class TaskTrackingView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
    super(leaf);

    this.plugin.taskTrackingService.addEventListener(ActiveTaskStartedEvent.EVENT_NAME, (evt: Event) => {
      const e: ActiveTaskStartedEvent = (evt as ActiveTaskStartedEvent);
      runningTaskStore.setValue(e.task);
    });

    this.plugin.taskTrackingService.addEventListener(ActiveTaskStoppedEvent.EVENT_NAME, (evt: Event) => {
      runningTaskStore.setValue(undefined);
    });

    this.plugin.taskTrackingService.addEventListener(CacheUpdatedEvent.EVENT_NAME, (evt: Event) => {
      runningTaskStore.setValue(this.plugin.taskTrackingService.runningTaskEntry);
      taskStore.setValue(this.plugin.taskTrackingService.getListOfPreselectedTasks());
    });

    // @ts-ignore
    this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:metadata-change", () => {
      runningTaskStore.setValue(this.plugin.taskTrackingService.runningTaskEntry);
      taskStore.setValue(this.plugin.taskTrackingService.getListOfPreselectedTasks());
    }));

    this.root = createRoot(this.containerEl.children[1]);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Time Tracker: Task tracking";
  }

  async onOpen(): Promise<void> {
    const appContext: AppContextValue = {
      settings: this.plugin.settings,
      view: this,
    }

    this.root?.render(
      <StrictMode>
        <AppContext.Provider value={appContext}>
          <TaskListComponent
            onStart={(t) => this.plugin.taskTrackingService.startTracking(t.text)}
            onStop={(t) => this.plugin.taskTrackingService.stopRunningTracking()}
            onJumpTo={(t) => this.onJumpToFile(t)}
          />
        </AppContext.Provider>
      </StrictMode>
    )
  }

  onJumpToFile(task: TaskListEntry) {
    const file = this.app.vault.getFileByPath(task.path);

    if (file) {
      const leaf = this.app.workspace.getLeaf(true);
      leaf.openFile(file);
    }
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}