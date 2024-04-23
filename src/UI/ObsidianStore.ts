import type { View } from "obsidian";
import type { TimeTrackerSettings } from "src/Types/TimeTrackerSettings";
import { writable } from "svelte/store";

export const obsidianView = writable<View>();
export const obsidianSettings = writable<TimeTrackerSettings>();
