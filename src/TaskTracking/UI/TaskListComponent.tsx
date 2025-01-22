import React from "react"
import { ActiveTaskComponent } from "./ActiveTaskComponent"
import { TextTaskComponent } from "./TextTaskComponent";
import { TaskComponent } from "./TaskComponent";
import { runningTaskStore, taskStore } from "./Stores";
import { TaskListEntry } from "../Types/TaskListEntry";

interface TaskListComponentProps {
  onStart: (task: TaskListEntry) => void;
  onStop: (task: TaskListEntry) => void;
  onJumpTo: (task: TaskListEntry) => void;
}

export const TaskListComponent = (prop: TaskListComponentProps) => {
  const taskList = taskStore.syncExternalStore();
  const runningTask = runningTaskStore.syncExternalStore();

  return (
    <div className="task-component-list">
      <ActiveTaskComponent task={runningTask} onStop={prop.onStop} />
      <TextTaskComponent onStart={prop.onStart} />

      {taskList?.map((e) => {
        return (<TaskComponent key={`${e.text}#${e.path}`} task={e} onStartTask={prop.onStart} onTextClick={prop.onJumpTo}></TaskComponent>);
      })}
    </div>
  )
}
