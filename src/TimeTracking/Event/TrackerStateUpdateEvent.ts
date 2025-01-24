import { TrackerState } from "../Types/TrackerState";


export class TrackerStateUpdateEvent extends Event {
  public static readonly EVENT_NAME = "tracker-state-update";
  private _newState: TrackerState | undefined;
  private _oldState: TrackerState | undefined;

  get newState(): TrackerState | undefined {
    return this._newState;
  }

  get oldState(): TrackerState | undefined {
    return this._oldState;
  }

  constructor(oldState: TrackerState | undefined, newState: TrackerState | undefined) {
    super(TrackerStateUpdateEvent.EVENT_NAME);

    this._newState = newState;
    this._oldState = oldState;
  }
}