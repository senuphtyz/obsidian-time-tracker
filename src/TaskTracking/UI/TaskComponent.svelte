<script lang="ts">
	import { Play } from "lucide-svelte";
	import type { Task } from "src/TaskTracking/Types/Task";
	import { State, type TaskTrackingEvent } from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import { renderMarkdown } from "./Markdown";
	import { obsidianView } from "./ObsidianStore";
	import type { TaskListEntry } from "../Types/TaskListEntry";

	export let task: TaskListEntry;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
	}>();

	function start() {
		// dispatch("startStop", {
		// 	task: task.text,
		// 	currentState: State.STOPPED,
		// });
	}
</script>

<div class="task-component">
	<div
		class="text"
		use:renderMarkdown={{
			view: $obsidianView,
			text: task.text,
			path: task.path,
		}}
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
		}

		button {
			cursor: pointer;
		}
	}
</style>
