export class CacheUpdatedEvent extends Event {
    public static readonly EVENT_NAME = "cache-updated-event";

    constructor() {
        super(CacheUpdatedEvent.EVENT_NAME);
    }
}