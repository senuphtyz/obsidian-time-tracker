import TimeTrackerPlugin from "src/TimeTrackerPlugin";
import { type DataviewApi } from "obsidian-dataview";
import { FrontMatterCache, TAbstractFile } from "obsidian";
import { NoteService } from "src/NoteService";
import { TrackerState } from "./Types/TrackerState";
import { EventAwareService } from "src/Common/Service/EventAwareService";
import { TrackerStateUpdateEvent } from "./Event/TrackerStateUpdateEvent";
import moment, { Moment } from "moment";
import { TrackerTimeUpdateEvent } from "./Event/TrackerTimeUpdateEvent";
import { TrackerTime } from "./Types/TrackerTime";
import { DailyNoteMissingException } from "src/Exception";


export class TimeTrackerService extends EventAwareService {
  readonly FRONT_MATTER_KEY = "time_tracking";
  private trackerState: TrackerState | undefined = undefined;
  private trackerTimes: TrackerTime = {}

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

  /**
   * Updating the tracker state and time values and notifying subscribers about it.
   */
  private updateState(): void {
    try {
      this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
        const settings = this.plugin.settings;
        let newState: TrackerState | undefined = undefined;

        this.trackerTimes.start = fm[settings.property_work_start];
        this.trackerTimes.pause_start = fm[settings.property_pause_start];
        this.trackerTimes.pause_end = fm[settings.property_pause_end];
        this.trackerTimes.stopped = fm[settings.property_work_end];

        this.eventTarget.dispatchEvent(new TrackerTimeUpdateEvent(this.getTimeRunning()))

        if (this.trackerTimes.stopped) {
          newState = TrackerState.STOPPED;
        } else if (this.trackerTimes.pause_end) {
          newState = TrackerState.PAUSE_STOPPED;
        } else if (this.trackerTimes.pause_start) {
          newState = TrackerState.PAUSE_STARTED;
        } else if (this.trackerTimes.start) {
          newState = TrackerState.STARTED;
        } else {
          newState = TrackerState.NOT_RUNNING;
        }

        if (this.trackerState == newState) {
          return;
        }

        const oldState = this.trackerState;
        this.trackerState = newState;
        this.eventTarget.dispatchEvent(new TrackerStateUpdateEvent(oldState, newState));
      });
    } catch (ex) {
      if (ex instanceof DailyNoteMissingException) {
        this.eventTarget.dispatchEvent(new TrackerStateUpdateEvent(undefined, TrackerState.NOT_RUNNING));
      } else {
        console.error('Error while calculating tracker state', ex);
      }
    }
  }

  /**
   * Calculates the duration of work for a day.
   * 
   * @param times The tracker time object to calculate the duration for.
   * @returns The duration of work for the day in HH:mm format.
   */
  private calcWorkDurationOfDay(times: TrackerTime): string {
    if (!times.start) {
      return "00:00";
    }

    const start = moment.duration(times.start);
    const end = times.stopped ? moment.duration(times.stopped) : moment.duration(moment().format("HH:mm"));
    let diff = end.subtract(start)

    if (!!times.pause_start && !!times.pause_end) {
      diff = diff.subtract(
        moment.duration(times.pause_end).subtract(moment.duration(times.pause_start))
      )
    }

    const hours = diff.asHours();

    return `${(hours | 0).toString().padStart(2, '0')}:${(Math.round(hours % 1 * 60)).toString().padStart(2, '0')}`;
  }

  onload(): void {
    this.plugin.registerEvent(this.plugin.app.metadataCache.on('changed', (abstractFile: TAbstractFile) => {
      this.updateState();
    }));

    // @ts-ignore
    this.plugin.registerEvent(this.plugin.app.metadataCache.on("dataview:index-ready", () => {
      this.updateState();
    }));

    this.registerInterval(window.setInterval(() => {
      this.updateState();
    }, 60000));
  }

  /**
   * Calculates the duration for the current day and returns it as a string in the format HH:MM.
   */
  getTimeRunning(): string {
    return this.calcWorkDurationOfDay(this.trackerTimes);
  }

  /**
   * Calculates the duration between two dates and returns it as a string in the format HH:MM.
   * 
   * @param start The start date.
   * @param end The end date.
   * @returns The duration between the two dates as a string in the format HH:MM.
   */
  getDurationBetweenDates(start: Moment, end: Moment): Promise<string> {
    const settings = this.plugin.settings;
    const ret: Promise<string>[] = [];
    let d = start;

    while (d.isBefore(end)) {
      try {
        const promise = this.noteService.processFrontMatter<string>(d, (fm: FrontMatterCache): string => {
          return this.calcWorkDurationOfDay({
            start: fm[settings.property_work_start],
            pause_start: fm[settings.property_pause_start],
            pause_end: fm[settings.property_pause_end],
            stopped: fm[settings.property_work_end],
          })
        });

        ret.push(promise);
      } catch {
        // ignore missing daily notes
      }
      d = d.add(1, "d");
    }

    return Promise.all(ret).then((values: string[]) => {
      let ret = moment.duration("00:00");

      for (const v of values) {
        ret = ret.add(moment.duration(v));
      }

      const hours = ret.asHours();
      return `${(hours | 0).toString().padStart(2, '0')}:${(Math.round(hours % 1 * 60)).toString().padStart(2, '0')}`;
    });
  }

  /**
   * Write the time of the current day into the frontmatter.
   * Depending on the state of the tracker, this will either start or stop tracking time.
   */
  storeTime(): void {
    const settings = this.plugin.settings;

    this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
      const currentTimeString = this.getRoundedCurrentTime();

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

  /**
   * Get rounded current time in HH:mm format (rounds to 15-minute intervals).
   */
  private getRoundedCurrentTime(): string {
    let currentTime = moment();
    currentTime = currentTime.seconds(0).minutes(
      currentTime.seconds(0).minutes() - (currentTime.seconds(0).minutes() % 15)
    );
    return currentTime.format("HH:mm");
  }

  /**
   * Directly stop the current day's work session.
   * This sets the work_end time and transitions to STOPPED state.
   * If in PAUSE_STARTED state, uses pause_start time as the stop time.
   */
  stopDay(): void {
    const settings = this.plugin.settings;

    this.noteService.processFrontMatter(undefined, (fm: FrontMatterCache) => {
      let stopTime: string;
      
      // If we're in PAUSE_STARTED state, use the pause_start time as stop time
      if (this.trackerState === TrackerState.PAUSE_STARTED) {
        stopTime = fm[settings.property_pause_start];
        // Clear the pause_start since we're stopping instead of continuing the pause
        delete fm[settings.property_pause_start];
      } else {
        // Otherwise use current rounded time
        stopTime = this.getRoundedCurrentTime();
      }

      // Set the work end time to stop the day
      fm[settings.property_work_end] = stopTime;

      this.updateState();
    });
  }
}