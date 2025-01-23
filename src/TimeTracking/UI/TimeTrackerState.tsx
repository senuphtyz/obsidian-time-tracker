import { AlarmClockPlus, Pause, Play, Square } from "lucide-react";
import { useCallback, useState } from "react";
import { stateStore } from "./Stores";
import { TrackerState } from "../Types/TrackerState";


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

    case TrackerState.PAUSED:
      return <Pause size={props.size} />

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
  const [fontSize, setFontSize] = useState(5);

  const ref = useCallback((node: HTMLDivElement) => {
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const e = node.clientHeight * 0.75;
      setFontSize(Math.min(50, e));
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="state" ref={ref} onClick={props.onClick}>
      <TimeTrackerStateIcon size={fontSize} />
      <span style={{ fontSize: fontSize }} className="time">{props.time}</span>
    </div>
  );
};