<script lang="ts">
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

<style lang="scss">
	.text-component {
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

			input {
				width: 100%;
			}
		}

		button {
			cursor: pointer;
		}
	}
</style>
