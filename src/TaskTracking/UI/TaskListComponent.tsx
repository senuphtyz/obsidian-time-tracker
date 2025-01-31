import { useEffect, useState } from "react";
import { TaskListEntry } from "../Types/TaskListEntry";
import { ActiveTaskComponent } from "./ActiveTaskComponent";
import { runningTaskStore, taskStore } from "./Stores";
import { TaskComponent } from "./TaskComponent";
import { TextTaskComponent } from "./TextTaskComponent";

interface TaskListComponentProps {
  onStart: (task: TaskListEntry) => void;
  onStop: (task: TaskListEntry) => void;
  onJumpTo: (task: TaskListEntry) => void;
}

export const TaskListComponent = (prop: TaskListComponentProps) => {
  const [filter, setFilter] = useState<string>("");
  const [filteredList, setFilteredList] = useState<TaskListEntry[]>([]);
  const taskList = taskStore.syncExternalStore();
  const runningTask = runningTaskStore.syncExternalStore();

  const startTask = (task: TaskListEntry) => {
    setFilter("");
    prop.onStart(task);
  };

  useEffect(() => {
    const lowerFilter = filter.toLocaleLowerCase();

    setFilteredList((taskList ?? []).filter((t) => {
      return (filter == "" || t.text.toLocaleLowerCase().contains(lowerFilter));
    }));
  }, [taskList, filter]);

  return (
    <div className="task-component-list">
      <ActiveTaskComponent task={runningTask} onStop={prop.onStop} />
      <TextTaskComponent onStart={startTask} onSearch={setFilter} filter={filter} />

      {filteredList.map((e) => {
        return (<TaskComponent key={`${e.text}#${e.path}`} task={e} onStartTask={startTask} onTextClick={prop.onJumpTo}></TaskComponent>);
      })}
    </div>
  )
}
