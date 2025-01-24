import TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { type DataviewApi } from "obsidian-dataview";
import { FrontMatterCache, TAbstractFile } from "obsidian";
import { NoteService } from "src/NoteService";
import { TrackerState } from "./Types/TrackerState";
import { EventAwareService } from "src/Common/Service/EventAwareService";
import { TrackerStateUpdateEvent } from "./Event/TrackerStateUpdateEvent";
import moment from "moment";

export class TimeTrackerService extends EventAwareService {
  readonly FRONT_MATTER_KEY = "time_tracking";
  private trackerState: TrackerState | undefined = undefined;

  constructor(
    private plugin: TimeTrackerPlugin,
    private api: DataviewApi,
    private noteService: NoteService
  ) {
    super();

    if (this.api === null) {
      throw new Error('Dataview API cannot be null');
    }
  }

  private updateState(): void {
    this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
      const settings = this.plugin.settings;
      let newState: TrackerState | undefined = undefined;

      if (fm[settings.property_work_end]) {
        newState = TrackerState.STOPPED;
      } else if (fm[settings.property_pause_end]) {
        newState = TrackerState.PAUSE_STOPPED;
      } else if (fm[settings.property_pause_start]) {
        newState = TrackerState.PAUSE_STARTED;
      } else if (fm[settings.property_work_start]) {
        newState = TrackerState.STARTED;
      } else {
        newState = TrackerState.NOT_RUNNING;
      }

      if (this.trackerState == newState) {
        console.info("NO UPDATE", newState);
        return;
      }

      console.info("UPDATE NEW STATE", newState, this.trackerState);

      const oldState = this.trackerState;
      this.trackerState = newState;
      this.eventTarget.dispatchEvent(new TrackerStateUpdateEvent(oldState, newState));
    });
  }

  onload(): void {
    console.info("onload!");

    this.plugin.registerEvent(this.plugin.app.metadataCache.on('changed', (abstractFile: TAbstractFile) => {
      console.info("metacache update");
      this.updateState();
    }));

    // @ts-ignore
    this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:index-ready", () => {
      console.info("dataview:index-ready");
      this.updateState();
    }));
  }

  storeTime() {
    const settings = this.plugin.settings;

    this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
      let currentTime = moment();
      currentTime = currentTime.seconds(0).minutes(
        currentTime.seconds(0).minutes() - (currentTime.seconds(0).minutes() % 15)
      )
      const currentTimeString = currentTime.format("HH:mm");

      if (this.trackerState === undefined || this.trackerState === TrackerState.NOT_RUNNING) {
        // change from NOT_RUNNING to STARTED
        fm[settings.property_work_start] = currentTimeString;
      } else if (this.trackerState === TrackerState.STARTED) {
        // change from STARTED to PAUSE_STARTED
        fm[settings.property_pause_start] = currentTimeString;
      } else if (this.trackerState === TrackerState.PAUSE_STARTED) {
        // change from PAUSE_STARTED to PAUSE_STOPPED
        fm[settings.property_pause_end] = currentTimeString;
      } else if (this.trackerState === TrackerState.PAUSE_STOPPED || this.trackerState === TrackerState.STOPPED) {
        fm[settings.property_work_end] = currentTimeString;
      }

      this.updateState();
    });
  }
}