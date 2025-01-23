import React from "react"
import { Play } from "lucide-react";
import "./TaskComponent.scss";
import { TaskListEntry } from "../Types/TaskListEntry";
import { RenderMarkdown } from "./RenderMarkdown";


interface TaskComponentProps {
  task: TaskListEntry
  onTextClick: (task: TaskListEntry) => void;
  onStartTask: (task: TaskListEntry) => void;
}

export const TaskComponent = (prop: TaskComponentProps) => {
  return (
    <div className="task-component">
      <RenderMarkdown path={prop.task.path} text={prop.task.text} onClick={() => { prop.onTextClick(prop.task) }} />
      <button onClick={() => { prop.onStartTask(prop.task) }}>
        <Play
          size="18"
          color="var(--color-green)"
          style={{ marginBottom: "-1px" }}
        />
      </button>
    </div>
  )
}
