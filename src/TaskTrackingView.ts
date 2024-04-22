import { ItemView, WorkspaceLeaf } from "obsidian";
import { getAPI } from "obsidian-dataview";
import TaskListComponent from "./UI/TaskListComponent.svelte";
import type { Task } from "./Types/Task";
import obsidianView from "./UI/ObsidianStore";

export const VIEW_TYPE = "time-tracker-task-tracking-view";

export class TaskTrackingView extends ItemView {
    taskListComponent: TaskListComponent | null;

    constructor(leaf: WorkspaceLeaf) {
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
        const api = getAPI();
        container.empty();

        const tasks = api.pages().file.tasks.values.filter((t: Task) => !t.completed);

        obsidianView.set(this);
        this.taskListComponent = new TaskListComponent({
            target: this.contentEl,
            props: { tasks: tasks.slice(0, 5) }
        });
    }

    async onClose(): Promise<void> {
        this.taskListComponent?.$destroy();
    }
}