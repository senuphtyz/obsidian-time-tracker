import React, { useContext } from "react";
import { CalendarClock } from "lucide-react";
import moment from "moment";
import type { TaskListEntry } from "../Types/TaskListEntry";
import { AppContext, AppContextValue } from "./Contexts";

export interface LastTrackedProps {
  task: TaskListEntry
}

export const LastTracked = (props: LastTrackedProps) => { // removed 'prop:' since you're using destructuring
  const context: AppContextValue = useContext(AppContext);

  if (props.task.last == null || context === undefined) {
    return <></>;
  }

  return (
    <>
      <CalendarClock
        size="18"
        style={{ marginBottom: "-2px" }}
        color="var(--interactive-accent)"
        strokeWidth="2px"
      />

      <span>{moment(props.task.last.start, "YYYY-MM-DD HH:mm").format(context.settings.datetime_format)}</span>
      <span>→</span>
      <span>{moment(props.task.last.end, "YYYY-MM-DD HH:mm").format(context.settings.time_format)}</span>
    </>
  )
}
