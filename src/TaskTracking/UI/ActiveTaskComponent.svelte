<script lang="ts">
	import moment from "moment";
	import { Timer, Pause, CalendarClock } from "lucide-svelte";
	import {
		State,
		type TaskTrackingEvent,
	} from "src/TaskTracking/UI/TaskTrackingEvent";
	import { createEventDispatcher } from "svelte";
	import { renderMarkdown } from "./Markdown";
	import { obsidianView, obsidianSettings } from "./ObsidianStore";
	import type { TaskListEntry } from "../Types/TaskListEntry";

	export let task: TaskListEntry;
	export let disabled: boolean = false;

	let timer: string = "";
	let clear: string | number | NodeJS.Timeout | undefined;

	$: {
		clearInterval(clear);
		clear = setInterval(tick, 60000); // 1 min
	}

	const dispatch = createEventDispatcher<{
		startStop: TaskTrackingEvent;
	}>();

	function startStop() {
		tick();

		dispatch("startStop", {
			task: task,
			currentState: State.TRACKING,
		});
	}

	function tick() {
		const c = moment();
		const s = task.start;
		const d = c.diff(s);
		const ms = d / 1000;

		timer = `${((ms / 3600) | 0).toString().padStart(2, "0")}:${((((ms / 3600) % 1) * 60) | 0).toString().padStart(2, "0")}`;
	}

	tick();
</script>


<div class="active-task">
	<div
		class="task"
		use:renderMarkdown={{
			view: $obsidianView,
			text: task.text,
			path: task.path,
		}}
	></div>
	<div class="attributes">
		<div
			class="path"
			use:renderMarkdown={{
				view: $obsidianView,
				text:task.path,
				path: task.path,
			}}
		></div>
		<div class="tags">
			<!-- {#each task.tags as name}
				<span class="tag">{name}</span>
			{/each} -->
		</div>
	</div>
	<div class="footer">
		<div class="last-tracked">
			{#if task.last}
				<CalendarClock
					size="18"
					style="margin-bottom: -2px"
					color="var(--interactive-accent)"
					strokeWidth="2px"
				/>

				<span
					>{moment(task.last.start, "YYYY-MM-DD HH:mm").format(
						$obsidianSettings.datetime_format,
					)}</span
				>
				<span>→</span>
				<span
					>{moment(task.last.end, "YYYY-MM-DD HH:mm").format(
						$obsidianSettings.time_format,
					)}</span
				>
			{/if}
		</div>
		<div class="timer">
			{#if timer != ""}
				<Timer
					size="18"
					style="margin-bottom: -2px"
					color="var(--interactive-accent)"
					strokeWidth="2px"
				/>
				<span>{timer}</span>
			{/if}
		</div>
		<div class="action">
			<button on:click={startStop} {disabled}>
				<Pause
					size="18"
					color="var(--color-red)"
					style="margin-bottom: -1px"
				/>
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

		&:hover {
			background-color: var(--interactive-hover);
		}

		.task {
			font-size: 1em;
			font-weight: bold;
			padding: 2px 10px;
		}

		.attributes {
			padding: 5px 10px;

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
				padding: 2px 0;
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
