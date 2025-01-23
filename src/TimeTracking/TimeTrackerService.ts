import TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { type DataviewApi } from "obsidian-dataview";
import { Component, FrontMatterCache, TFile } from "obsidian";
import { NoteService } from "src/NoteService";
import { TrackerState } from "./Types/TrackerState";
import moment from "moment";


export class TimeTrackerService extends Component {
  readonly FRONT_MATTER_KEY = "time_tracking";
  private eventTarget: EventTarget;

  constructor(
    private plugin: TimeTrackerPlugin,
    private api: DataviewApi,
    private noteService: NoteService
  ) {
    super();
    this.eventTarget = new EventTarget();

    if (this.api === null) {
      throw new Error('Dataview API cannot be null');
    }
  }

  onload(): void {
    // this.plugin.registerEvent(this.plugin.app.metadataCache.on('changed', (abstractFile: TAbstractFile) => {
    //   if (isDailyNote(this.plugin.app, abstractFile)) {
    //     this.updateCacheForFile(abstractFile);
    //     this.eventTarget.dispatchEvent(new CacheUpdatedEvent());
    //   }
    // }));

    // // @ts-ignore
    // this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:index-ready", () => {
    //   for (const e of this.taskReferenceQueue) {
    //     e.taskReference = this.findReferencedTask(e.entry);
    //   }

    //   this.taskReferenceQueue.clear();
    //   this.eventTarget.dispatchEvent(new CacheUpdatedEvent());
    // }));

    // if (!this.plugin.app.workspace.layoutReady) {
    //   this.plugin.app.workspace.onLayoutReady(async () => this.cacheTrackingData());
    // } else {
    //   this.cacheTrackingData();
    // }
  }

  /**
   * Wrapper for addEventListener.
   */
  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    this.eventTarget.addEventListener(type, callback, options);
  }

  /**
   * Wrapper for removeEventListener.
   */
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    this.eventTarget.removeEventListener(type, callback, options);
  }

  getCurrentState(): TrackerState {
    try {
      const settings = this.plugin.settings;
      let ret = TrackerState.NOT_RUNNING;

      this.noteService.processFrontMatter(undefined, (fmc: FrontMatterCache) => {
        console.info(fmc, fmc[settings.property_work_start]);

        if (fmc[settings.property_work_start]) {
          ret = TrackerState.STARTED;
          return;
        }

        if (fmc[settings.property_pause_start]) {
          ret = TrackerState.PAUSED;
          return;
        }

        if (fmc[settings.property_pause_end]) {
          ret = TrackerState.STARTED;
          return;
        }

        if (fmc[settings.property_work_end]) {
          ret = TrackerState.STOPPED;
          return;
        }
      });

      console.info("RET", ret);
      return ret;
    } catch (ex) {
      console.error(ex);
    }

    return TrackerState.NOT_RUNNING;
  }

  storeTime() {
    this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
      let property;

      switch (this.getCurrentState()) {
        case TrackerState.NOT_RUNNING:
          property = this.plugin.settings.property_work_start;
          break;

        case TrackerState.STARTED:
          property = this.plugin.settings.property_pause_start;

          if (this.plugin.settings.property_pause_end in fm && !fm[this.plugin.settings.property_pause_end]) {
            property = this.plugin.settings.property_work_end;
          }
          break;

        case TrackerState.PAUSED:
          property = this.plugin.settings.property_pause_end;
          break;

        case TrackerState.STOPPED:
          property = this.plugin.settings.property_work_end;
          break;
      }


      let currentTime = moment();
      currentTime = currentTime.seconds(0).minutes(
        currentTime.seconds(0).minutes() - (currentTime.seconds(0).minutes() % 15)
      )
      fm[property] = currentTime.format("HH:mm");
    });
  }
}