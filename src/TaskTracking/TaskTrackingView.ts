import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskListComponent from "./UI/TaskListComponent.svelte";
import { obsidianView, obsidianSettings } from "./UI/ObsidianStore";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { type TaskTrackingEvent } from "./UI/TaskTrackingEvent";

export const VIEW_TYPE = "time-tracker-task-tracking-view";

export class TaskTrackingView extends ItemView {
    taskListComponent: TaskListComponent | null;

    constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
        super(leaf);

        this.taskListComponent = null;
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
                currentTask: this.plugin.taskTrackingService.getRunningTaskEntry(),
            }
        });
        this.taskListComponent.$on("startStop", this.onStartStop.bind(this));
    }

    onStartStop(evt: CustomEvent<TaskTrackingEvent>) {
        // const d = evt.detail;

        // if (d.currentState == State.STOPPED) {
        //     this.taskTrackingService.startTaskTracking(d.task.text);
        // } else {
        //     this.taskTrackingService.stopTaskTracking(d.task.text);
        // }
    }

    async onClose(): Promise<void> {
        this.taskListComponent?.$destroy();
    }
}