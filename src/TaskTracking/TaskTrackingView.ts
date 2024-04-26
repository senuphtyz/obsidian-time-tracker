import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskListComponent from "./UI/TaskListComponent.svelte";
import { obsidianView, obsidianSettings } from "./UI/ObsidianStore";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { State, type TaskTrackingEvent } from "./UI/TaskTrackingEvent";
import { writable, type Writable } from "svelte/store";
import type { TaskListEntry } from "./Types/TaskListEntry";

export const VIEW_TYPE = "time-tracker-task-tracking-view";

export class TaskTrackingView extends ItemView {
    taskListComponent: TaskListComponent | null;
    currentTask: TaskListEntry | undefined
    currentTaskStore: Writable<TaskListEntry | undefined>;

    constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
        super(leaf);

        this.taskListComponent = null;
        this.currentTaskStore = writable(this.currentTask);
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Time Tracker: Task tracking";
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();

        const tasks = this.plugin.taskTrackingService.getListOfPreselectedTasks();

        obsidianView.set(this);
        obsidianSettings.set(this.plugin.settings);

        this.taskListComponent = new TaskListComponent({
            target: this.contentEl,
            props: {
                tasks: tasks,
                currentTask: this.currentTaskStore,
            }
        });
        this.taskListComponent.$on("startStop", this.onStartStop.bind(this));
        this.currentTaskStore.set(this.plugin.taskTrackingService.runningTaskEntry);
    }

    onStartStop(evt: CustomEvent<TaskTrackingEvent>) {
        const d = evt.detail;

        if (d.currentState == State.TRACKING) {
            this.plugin.taskTrackingService.stopRunningTracking();
            this.currentTaskStore.set(undefined);
        } else if (d.currentState == State.STOPPED) {
            this.plugin.taskTrackingService.startTracking(d.task.text, d.task.path);
            this.currentTaskStore.set(d.task);
        }
    }


    async onClose(): Promise<void> {
        this.taskListComponent?.$destroy();
    }
}