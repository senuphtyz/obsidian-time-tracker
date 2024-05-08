export class ActiveTaskStoppedEvent extends Event {
    public static readonly EVENT_NAME = "active-task-stopped";

    constructor() {
        super(ActiveTaskStoppedEvent.EVENT_NAME);
    }
}