<script lang="ts">
	import type { Task } from "src/TaskTracking/Types/Task";
	import { type TaskTrackingEvent } from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import TaskComponent from "./TaskComponent.svelte";
	import ActiveTaskComponent from "./ActiveTaskComponent.svelte";
	import type { TaskListEntry } from "../Types/TaskListEntry";
	import type { Writable } from "svelte/store";
	import TextTaskComponent from "./TextTaskComponent.svelte";
	import type { JumpToFileEvent } from "./JumpToFileEvent";

	export let tasks: Writable<TaskListEntry[]>;
	export let currentTask: Writable<TaskListEntry | undefined>;

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
		jumpToFile: JumpToFileEvent;
	}>();

	function startStop(e: CustomEvent<TaskTrackingEvent>) {
		const evt = e.detail;

		dispatch("startStop", {
			currentState: evt.currentState,
			task: evt.task,
		});
	}
</script>

<div class="task-component-list">
	{#if $currentTask}
		<ActiveTaskComponent task={$currentTask} on:startStop={startStop} />
	{/if}

	<TextTaskComponent on:startStop={startStop} />

	{#each $tasks as t}
		<TaskComponent task={t} on:startStop={startStop} on:jumpToFile/>
	{/each}
</div>
