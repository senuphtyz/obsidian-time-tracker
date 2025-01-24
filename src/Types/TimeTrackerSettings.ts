import type MobaTimeSettings from "./MobaTimeSettings";


interface TimeTrackerSettings {
  property_work_start: string;
  property_pause_start: string;
  property_pause_end: string;
  property_work_end: string;
  time_format: string;
  date_format: string;
  datetime_format: string;
  auto_task_transition: boolean
  moba: MobaTimeSettings;
}

const DEFAULT_SETTINGS: TimeTrackerSettings = {
  property_work_start: 'work_start',
  property_work_end: 'work_end',
  property_pause_start: 'pause_start',
  property_pause_end: 'pause_end',
  time_format: "HH:mm",
  date_format: "DD.MM.YYYY",
  datetime_format: "DD.MM.YYYY HH:mm",
  auto_task_transition: true,
  moba: {
    enabled: false,
    url: "",
    mandatorId: "",
    employeeId: "",
    ca: "",
  },
}

export { DEFAULT_SETTINGS };
export type { TimeTrackerSettings, MobaTimeSettings };
