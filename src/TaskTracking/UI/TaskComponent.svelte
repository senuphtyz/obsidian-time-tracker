<script lang="ts">
	import { Play } from "lucide-svelte";
	import type { Task } from "src/TaskTracking/Types/Task";
	import {
		State,
		type TaskTrackingEvent,
	} from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import { renderMarkdown } from "./Markdown";
	import { obsidianView } from "./ObsidianStore";
	import type { TaskListEntry } from "../Types/TaskListEntry";
	import type { JumpToFileEvent } from "./JumpToFileEvent";

	export let task: TaskListEntry;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
		jumpToFile: JumpToFileEvent;
	}>();

	function start() {
		dispatch("startStop", {
			task: task,
			currentState: State.STOPPED,
		});
	}

	function jumpToFile() {
		dispatch("jumpToFile", { task: task });
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="task-component">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="text"
		use:renderMarkdown={{
			view: $obsidianView,
			text: task.text,
			path: task.path,
		}}
		on:click={jumpToFile}
	></div>
	<button on:click={start} {disabled}>
		<Play
			size="18"
			color="var(--color-green)"
			style="margin-bottom: -1px"
		/>
	</button>
</div>

<style lang="scss">
	.task-component {
		padding: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--background-primary);
		margin: 10px 0;

		&:hover {
			background-color: var(--interactive-hover);
		}

		.text {
			flex-grow: 4;
			padding: 5px 20px 5px 5px;
			overflow: hidden;
			white-space: nowrap; /* Don't forget this one */
			text-overflow: ellipsis;
			cursor: pointer;
		}

		button {
			cursor: pointer;
		}
	}
</style>
