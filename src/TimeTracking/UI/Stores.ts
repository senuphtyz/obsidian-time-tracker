import { GenericStore } from "src/TaskTracking/Sync/GenericStore";
import { TrackerState } from "../Types/TrackerState";

export const stateStore = new GenericStore<TrackerState>();
export const timeStore = new GenericStore<string>();
export const monthTimeStore = new GenericStore<string>();
export const weekTimeStore = new GenericStore<string>();