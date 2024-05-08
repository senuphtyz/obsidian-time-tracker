<script lang="ts">
	import type { Task } from "src/TaskTracking/Types/Task";
	import { type TaskTrackingEvent } from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import TaskComponent from "./TaskComponent.svelte";
	import ActiveTaskComponent from "./ActiveTaskComponent.svelte";
	import type { TaskListEntry } from "../Types/TaskListEntry";
	import type { Writable } from "svelte/store";

	export let tasks: Writable<TaskListEntry[]>;
	export let currentTask: Writable<TaskListEntry | undefined>;

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
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

	{#each $tasks as t}
		<TaskComponent task={t} on:startStop={startStop} />
	{/each}
</div>
