import { ItemView, WorkspaceLeaf } from "obsidian";
import { TaskListComponent } from "./UI/TaskListComponent";
// import { obsidianView, obsidianSettings } from "./UI/ObsidianStore";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
// import { State, type TaskTrackingEvent } from "./UI/TaskTrackingEvent";
// import { writable, type Writable } from "svelte/store";
// import { ActiveTaskStartedEvent } from "./Event/ActiveTaskStartedEvent";
// import { ActiveTaskStoppedEvent } from "./Event/AcitveTaskStoppedEvent";
// import { CacheUpdatedEvent } from "./Event/CacheUpdatedEvent";
// import type { JumpToFileEvent } from "./UI/JumpToFileEvent";
import { StrictMode } from "react";
import { Root, createRoot } from 'react-dom/client';
import { CacheUpdatedEvent } from "./Event/CacheUpdatedEvent";
import { AppContext, AppContextValue } from "./UI/Contexts";
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
            onJumpTo={this.onJumpToFile}
          />
        </AppContext.Provider>
      </StrictMode>
    )


    // this.taskListStore.set(this.plugin.taskTrackingService.getListOfPreselectedTasks());

    // obsidianView.set(this);
    // obsidianSettings.set(this.plugin.settings);

    // this.taskListComponent = new TaskListComponent({
    //     target: this.contentEl,
    //     props: {
    //         tasks: this.taskListStore,
    //         currentTask: this.currentTaskStore,
    //     }
    // });
    // this.taskListComponent.$on("startStop", this.onStartStop.bind(this));
    // this.taskListComponent.$on("jumpToFile", this.onJumpToFile.bind(this));
    // this.currentTaskStore.set(this.plugin.taskTrackingService.runningTaskEntry);
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