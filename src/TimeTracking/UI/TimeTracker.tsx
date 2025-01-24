import { Clock } from "lucide-react";
import { monthTimeStore, timeStore, weekTimeStore } from "./Stores";
import "./TimeTracker.scss";
import { TimeTrackerState } from "./TimeTrackerState";
import { useCallback, useState } from "react";

export interface TimeTrackerProps {
  onClick: () => void;
}

export const TimeTracker = (props: TimeTrackerProps) => {
  const runningTime = timeStore.syncExternalStore();
  const monthTime = monthTimeStore.syncExternalStore();
  const weekTime = weekTimeStore.syncExternalStore();
  const [hidden, setHidden] = useState(true);

  const ref = useCallback((node: HTMLDivElement) => {
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      console.info("MUH", node.clientHeight < 182, node.clientHeight);
      setHidden(node.clientHeight < 182);
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);


  return (
    <div className="time-tracker" ref={ref}>
      <div className="info-panels" hidden={hidden}>
        <div className="panel">
          <Clock size={40} />
          <div className="text">
            <span>Worked this week</span>
            <span className="time">{weekTime ?? '--:--'}</span>
          </div>
        </div>
        <div className="panel">
          <Clock size={40} />
          <div className="text">
            <span>Worked this month</span>
            <span className="time">{monthTime ?? '--:--'}</span>
          </div>
        </div>
      </div>

      <div className="control">
        <TimeTrackerState time={runningTime} onClick={() => props.onClick()} />
      </div>
    </div>
  )
}