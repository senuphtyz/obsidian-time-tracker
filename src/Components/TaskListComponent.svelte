<script lang="ts">
	import type { Task } from "src/Types/Task";
	import ActiveTaskComponent from "./ActiveTaskComponent.svelte";
	import TaskComponent from "./TaskComponent.svelte";
	import { State, type TaskTrackingEvent } from "src/Types/TaskTrackingEvent";
	import { flip } from "svelte/animate";
	import type { App, Component } from "obsidian";

	export let app: App;
	export let component: Component;
	export let tasks: Task[];

	function startStop(e: CustomEvent<TaskTrackingEvent>) {
		const evt = e.detail;

		if (evt.currentState != State.STOPPED || tasks[0] == evt.task) {
			return;
		}

		const idx = tasks.indexOf(evt.task);
		tasks.splice(idx, 1);
		tasks.unshift(evt.task);
		tasks = tasks;
		console.info(tasks);
	}
</script>

<div class="task-component-list">
	{#each tasks as t, idx (t)}
		<div animate:flip={{ duration: 400 }}>
			{#if idx == 0}
				<ActiveTaskComponent {app} {component} task={t} on:startStop={startStop} disabled={t.completed}/>
			{:else}
				<TaskComponent {app} {component} task={t} on:startStop={startStop} disabled={t.completed}/>
			{/if}
		</div>
	{/each}
</div>
