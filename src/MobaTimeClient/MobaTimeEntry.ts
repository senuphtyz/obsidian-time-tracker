import { EntryCode } from "./EntryCode";

export interface MobaTimeEntry {
    "periode0Date": string;
    "periode0Time": string;
    "selectedEntryCode": EntryCode;
    "note": string;
    "selectedPeriodType": number;
    "employeeId": string;
}
