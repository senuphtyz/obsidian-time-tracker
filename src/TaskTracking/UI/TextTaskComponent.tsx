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


{/* <script lang="ts">
	import { Play } from "lucide-svelte";
	import moment from "moment";
	import {
		State,
		type TaskTrackingEvent,
	} from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";

	let text: string = "";

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
	}>();

	function keyPress(e: KeyboardEvent) {
		if (e.key.toUpperCase() == "ENTER") {
			startStop();
		}
	}

	function startStop() {
		dispatch("startStop", {
			task: {
				text: text,
				last: null,
				path: "",
				start: moment(),
			},
			currentState: State.STOPPED,
		});

		text = "";
	}
</script>

<div class="text-component">
	<div class="text">
		<input type="text" bind:value={text} on:keypress={keyPress} />
	</div>
	<button on:click={startStop} disabled={text == ""}>
		<Play
			size="18"
			color="var(--color-green)"
			style="margin-bottom: -1px"
		/>
	</button>
</div>
 */}
