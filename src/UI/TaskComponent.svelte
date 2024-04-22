<script lang="ts">
	import { Play } from "lucide-svelte";
	import type { Task } from "src/Types/Task";
	import { State, type TaskTrackingEvent } from "src/Types/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import { renderMarkdown } from "./Markdown";
	import obsidianView from "./ObsidianStore";

	export let task: Task;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
	}>();

	function start() {
		dispatch("startStop", {
			task: task,
			currentState: State.STOPPED,
		});
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
