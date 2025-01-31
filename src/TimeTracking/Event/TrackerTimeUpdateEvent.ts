export class TrackerTimeUpdateEvent extends Event {
  public static readonly EVENT_NAME = "tracker-time-update";
  private _time: string;

  get time(): string {
    return this._time;
  }

  constructor(time: string) {
    super(TrackerTimeUpdateEvent.EVENT_NAME);

    this._time = time;
  }
}