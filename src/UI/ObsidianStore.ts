import type { View } from "obsidian";
import { writable } from "svelte/store";

const obsidianView = writable<View>();
export default obsidianView; 