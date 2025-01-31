import { Play } from "lucide-react";
import moment from "moment";
import { TaskListEntry } from "../Types/TaskListEntry";
import "./TextTaskComponent.scss";

interface TextTaskComponentProps {
  onStart: (task: TaskListEntry) => void;
  onSearch: (text: string) => void;
  filter: string;
}

export const TextTaskComponent = (prop: TextTaskComponentProps) => {
  return (
    <div className="text-component">
      <div className="text">
        <input type="text" onChange={(e) => { prop.onSearch(e.target.value) }} value={prop.filter} />
      </div>
      <button disabled={prop.filter == ""} onClick={() => { prop.onStart({ last: null, path: "", start: moment(), text: prop.filter }) }}>
        <Play
          size="18"
          color="var(--color-green)"
          style={{ marginBottom: "-1px" }}
        />
      </button>
    </div>
  )
}
