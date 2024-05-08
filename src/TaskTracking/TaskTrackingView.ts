import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskListComponent from "./UI/TaskListComponent.svelte";
import { obsidianView, obsidianSettings } from "./UI/ObsidianStore";
import type TimeTrackerPlugin from "../TimeTrackerPlugin";
import { State, type TaskTrackingEvent } from "./UI/TaskTrackingEvent";
import { writable, type Writable } from "svelte/store";
import type { TaskListEntry } from "./Types/TaskListEntry";
import { ActiveTaskStartedEvent } from "./Event/ActiveTaskStartedEvent";
import { ActiveTaskStoppedEvent } from "./Event/AcitveTaskStoppedEvent";
import { CacheUpdatedEvent } from "./Event/CacheUpdatedEvent";

export const VIEW_TYPE = "time-tracker-task-tracking-view";

export class TaskTrackingView extends ItemView {
    taskListComponent: TaskListComponent | null;
    currentTaskStore: Writable<TaskListEntry | undefined>;
    taskListStore: Writable<TaskListEntry[]>;

    constructor(leaf: WorkspaceLeaf, private plugin: TimeTrackerPlugin) {
        super(leaf);

        this.taskListComponent = null;
        this.currentTaskStore = writable(undefined);
        this.taskListStore = writable([]);

        this.plugin.taskTrackingService.addEventListener(ActiveTaskStartedEvent.EVENT_NAME, (evt: Event) => {
            const e: ActiveTaskStartedEvent = (evt as ActiveTaskStartedEvent);
            this.currentTaskStore.set(e.task);
        });

        this.plugin.taskTrackingService.addEventListener(ActiveTaskStoppedEvent.EVENT_NAME, (evt: Event) => {
            this.currentTaskStore.set(undefined);
        });

        this.plugin.taskTrackingService.addEventListener(CacheUpdatedEvent.EVENT_NAME, (evt: Event) => {
            this.taskListStore.set(this.plugin.taskTrackingService.getListOfPreselectedTasks());
            this.currentTaskStore.set(this.plugin.taskTrackingService.runningTaskEntry);
        });

        // @ts-ignore
        this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:metadata-change", () => {
            this.taskListStore.set(this.plugin.taskTrackingService.getListOfPreselectedTasks());
        }));
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

        this.taskListStore.set(this.plugin.taskTrackingService.getListOfPreselectedTasks());

        obsidianView.set(this);
        obsidianSettings.set(this.plugin.settings);

        this.taskListComponent = new TaskListComponent({
            target: this.contentEl,
            props: {
                tasks: this.taskListStore,
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
        } else if (d.currentState == State.STOPPED) {
            this.plugin.taskTrackingService.startTracking(d.task.text);
        }
    }

    async onClose(): Promise<void> {
        this.taskListComponent?.$destroy();
    }
}