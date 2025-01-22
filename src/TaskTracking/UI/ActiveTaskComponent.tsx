import React from "react";
import { Pause } from "lucide-react";
import type { TaskListEntry } from "../Types/TaskListEntry";
import './ActiveTaskComponent.scss';
import { LastTracked } from "./LastTracked";
import { Timer } from "./Timer";


export interface ActiveTaskComponentProp {
  task: TaskListEntry | null | undefined;
  onStop: (task: TaskListEntry) => void;
}

export const ActiveTaskComponent = (prop: ActiveTaskComponentProp) => {
  if (prop.task === null || prop.task === undefined) {
    return <></>
  }

  const task: TaskListEntry = prop.task;

  return (
    <div className="active-task">
      <div className="task">{task.text}</div>
      <div className="attributes">
        <div className="path">{task.path}</div>
        <div className="tags"></div>
      </div>
      <div className="footer">
        <div className="last-tracked">
          <LastTracked task={task} />
        </div>
        <div className="timer">
          <Timer task={task} />
        </div>
        <div className="action">
          <button onClick={() => { prop.onStop(task) }}>
            <Pause
              size="18"
              color="var(--color-red)"
              style={{ marginBottom: "-1px" }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
