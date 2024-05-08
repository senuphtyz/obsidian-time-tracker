import type { TaskListEntry } from "../Types/TaskListEntry";


export class ActiveTaskStartedEvent extends Event {
    public static readonly EVENT_NAME = "active-task-started";
    private _task: TaskListEntry | undefined

    get task(): TaskListEntry | undefined {
        return this._task;
    }

    constructor(task: TaskListEntry | undefined) {
        super(ActiveTaskStartedEvent.EVENT_NAME);

        this._task = task;
    }
}