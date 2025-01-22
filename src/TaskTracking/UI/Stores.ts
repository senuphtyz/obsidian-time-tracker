import { GenericStore } from "../Sync/GenericStore";
import { TaskListEntry } from "../Types/TaskListEntry";


export const taskStore = new GenericStore<TaskListEntry[]>();
export const runningTaskStore = new GenericStore<TaskListEntry | undefined>();