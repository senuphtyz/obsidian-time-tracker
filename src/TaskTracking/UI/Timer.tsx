import React, { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";
import moment from "moment";
import type { TaskListEntry } from "../Types/TaskListEntry";
import './ActiveTaskComponent.scss';

export interface TimerProps {
  task: TaskListEntry
}

export const Timer = (props: TimerProps) => {
  const [timer, setTimer] = useState<string>("00:00");

  const tick = () => {
    const c = moment();
    const s = props.task.start;
    const d = c.diff(s);
    const ms = d / 1000;

    setTimer(`${((ms / 3600) | 0).toString().padStart(2, "0")}:${((((ms / 3600) % 1) * 60) | 0).toString().padStart(2, "0")}`);
  }

  useEffect(() => {
    const interval = setInterval(tick, 60000);

    return () => {
      clearInterval(interval);
    }
  }, []);

  return (
    <>
      <TimerIcon
        size="18"
        style={{ marginBottom: "-2px" }}
        color="var(--interactive-accent)"
        strokeWidth="2px"
      />
      <span>{timer}</span>
    </>
  )
}