import MobaTimeSettings from "./MobaTimeSettings";


interface TimeTrackerSettings {
    property_work_start: string;
    property_pause_start: string;
    property_pause_end: string;
    property_work_end: string;
    time_format: string;
    moba: MobaTimeSettings;
}

const DEFAULT_SETTINGS: TimeTrackerSettings = {
    property_work_start: 'work_start',
    property_work_end: 'work_end',
    property_pause_start: 'pause_start',
    property_pause_end: 'pause_end',
    time_format: "HH:mm",
    moba: {
        url: "",
        mandatorId: "",
        employeeId: "",
        ca: "",
    },
}

export { DEFAULT_SETTINGS };
export type { TimeTrackerSettings, MobaTimeSettings };
