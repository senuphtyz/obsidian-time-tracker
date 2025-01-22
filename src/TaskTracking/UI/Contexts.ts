import { View } from "obsidian";
import { createContext } from "react";
import { TimeTrackerSettings } from "src/Types/TimeTrackerSettings";


export interface AppContextValue {
  view: View;
  settings: TimeTrackerSettings;
}

// @ts-ignore
export const AppContext = createContext<AppContextValue>(undefined);