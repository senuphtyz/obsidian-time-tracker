import { ItemView, WorkspaceLeaf } from "obsidian";
import { getAPI } from "obsidian-dataview";
import TaskListComponent from "./Components/TaskListComponent.svelte";

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

        const tasks = api.pages().file.tasks.values.filter(t => !t.completed);

        this.taskListComponent = new TaskListComponent({
            target: this.contentEl,
            props: { app: this.app, component: this, tasks: tasks.slice(0, 5) }
        });
    }

    async onClose(): Promise<void> {
        this.taskListComponent?.$destroy();
    }
}