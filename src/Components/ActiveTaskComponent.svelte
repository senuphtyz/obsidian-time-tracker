<script lang="ts">
	import { Timer, Play, Pause, CalendarClock } from "lucide-svelte";
	import { App, Component, MarkdownRenderer } from "obsidian";
	import type { Task } from "src/Types/Task";
	import { State, type TaskTrackingEvent } from "src/Types/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";

	export let app: App;
	export let component: Component;
	export let task: Task;
	export let running: boolean = true;
	export let disabled: boolean = false;
	export let timerStartTime: string = "17:44";

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
	}>();

	function startStop() {
		running = !running;

		dispatch("startStop", {
			task: task,
			currentState: running ? State.TRACKING : State.STOPPED,
		});
	}

	function render(node: HTMLDivElement) {
		MarkdownRenderer.render(
			app,
			task.text,
			node,
			task.path,
			component,
		).then(() => {
			const paragraph = node.firstChild;

			if (paragraph != null) {
				// @ts-ignore
				node.append(...paragraph.childNodes);
				paragraph.remove();
			}
		});
	}
</script>

<div class="active-task">
	<div class="task" use:render></div>
	<div class="attributes">
		<div class="path">{task.path}</div>
		<div class="tags">
			{#each task.tags as name}
				<span class="tag">{name}</span>
			{/each}
		</div>
	</div>
	<div class="footer">
		<div class="last-tracked">
			<CalendarClock size="18" style="margin-bottom: -2px" />
			<span>19.04.2024</span>
			<span>09:45 → 10:30</span>
		</div>
		<div class="timer">
			<Timer size="18" style="margin-bottom: -2px" />
			<span>{timerStartTime}</span>
		</div>
		<div class="action">
			<button on:click={startStop} {disabled}>
				{#if running}
					<Pause
						size="18"
						color="var(--color-red)"
						style="margin-bottom: -1px"
					/>
				{:else}
					<Play
						size="18"
						color="var(--color-green)"
						style="margin-bottom: -1px"
					/>
				{/if}
			</button>
		</div>
	</div>
</div>

<style lang="scss">
	.active-task {
		display: flex;
		flex-direction: column;
		background: var(--background-primary);
		padding: 5px;

		.task {
			font-size: 1em;
			font-weight: bold;
			padding: 2px 10px;
		}

		.attributes {
			padding: 2px 10px;

			.path {
				font-size: var(--font-ui-small);
			}

			.tags > .tag {
				display: inline-block;
				font-size: var(--font-ui-small);
				color: var(--tag-color);
				background-color: var(--tag-background);
				font-weight: var(--tag-weight);
				text-decoration: var(--tag-decoration);
				border-color: var(--tag-border-color);
				border-width: var(--tag-border-width);
				padding: var(--tag-padding-y) var(--tag-padding-x);
				border-radius: var(--tag-radius);

				&:hover {
					color: var(--tag-color-hover);
					background-color: var(--tag-background-hover);
					text-decoration: var(--tag-decoration-hover);
					border-color: var(--tag-border-color-hover);
				}
			}
		}

		.footer {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.last-tracked {
				flex-grow: 4;
				padding: 2px 10px;
			}

			.timer {
				padding: 2px 10px;
			}

			.action {
				background-color: var(--button-background);
				// padding: 2px 10px;

				button {
					border-radius: var(--button-radius);
				}
			}
		}

		button {
			cursor: pointer;
		}
	}
</style>
