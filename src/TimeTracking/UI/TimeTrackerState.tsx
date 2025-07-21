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
      return <Play size={props.size} color="#006400" />

    case TrackerState.PAUSE_STARTED:
      return <Pause size={props.size} />

    case TrackerState.PAUSE_STOPPED:
      return <Play size={props.size} color="#006400" />

    case TrackerState.STOPPED:
      return <Square size={props.size} />
  }

  return <></>;
};

export interface TimeTrackerStateProps {
  time: string;
  onClick: () => void;
}

export const TimeTrackerState = (props: TimeTrackerStateProps) => {
  return (
    <div className="state" onClick={props.onClick}>
      <TimeTrackerStateIcon size={50} />
      <span style={{ fontSize: 50 }} className="time">{props.time}</span>
    </div>
  );
};