import { GenericStore } from "src/TaskTracking/Sync/GenericStore";
import { TrackerState } from "../Types/TrackerState";

export const stateStore = new GenericStore<TrackerState>();
