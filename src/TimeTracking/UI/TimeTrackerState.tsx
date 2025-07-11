import { AlarmClockPlus, Pause, Play, Square } from "lucide-react";
import { TrackerState } from "../Types/TrackerState";
import { stateStore } from "./Stores";


interface TimeTrackerStateIconProps {
  size: number
}

const TimeTrackerStateIcon = (props: TimeTrackerStateIconProps) => {
  const state = stateStore.syncExternalStore();

  switch (state) {
    case TrackerState.NOT_RUNNING:
      return <AlarmClockPlus size={props.size} />

    case TrackerState.STARTED:
      return <Play size={props.size} />

    case TrackerState.PAUSE_STARTED:
      return <Pause size={props.size} />

    case TrackerState.PAUSE_STOPPED:
      return <Play size={props.size} />

    case TrackerState.STOPPED:
      return <Square size={props.size} />
  }

  return <></>;
};

export interface TimeTrackerStateProps {
  time: string;
  onClick: () => void;
  onStopDay: () => void;
}

export const TimeTrackerState = (props: TimeTrackerStateProps) => {
  const state = stateStore.syncExternalStore();
  
  // Show stop button when tracking is active (but not when already stopped)
  const showStopButton = state === TrackerState.STARTED || state === TrackerState.PAUSE_STOPPED;

  return (
    <div className="state" onClick={props.onClick}>
      <TimeTrackerStateIcon size={50} />
      <span style={{ fontSize: 50 }} className="time">{props.time}</span>
      {showStopButton && (
        <div 
          className="stop-button" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the main onClick
            props.onStopDay();
          }}
        >
          <Square size={20} />
        </div>
      )}
    </div>
  );
};