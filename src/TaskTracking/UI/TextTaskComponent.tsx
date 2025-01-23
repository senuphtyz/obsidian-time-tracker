import React, { useState } from "react"
import moment from "moment";
import "./TextTaskComponent.scss";
import { Play } from "lucide-react";
import { TaskListEntry } from "../Types/TaskListEntry";

interface TextTaskComponentProps {
  onStart: (task: TaskListEntry) => void;
}

export const TextTaskComponent = (prop: TextTaskComponentProps) => {
  const [inputText, setInputText] = useState<string>("");

  return (
    <div className="text-component">
      <div className="text">
        <input type="text" onChange={(e) => { setInputText(e.target.value); }} />
      </div>
      <button disabled={inputText == ""} onClick={() => { prop.onStart({ last: null, path: "", start: moment(), text: inputText }) }}>
        <Play
          size="18"
          color="var(--color-green)"
          style={{ marginBottom: "-1px" }}
        />
      </button>
    </div>
  )
}
