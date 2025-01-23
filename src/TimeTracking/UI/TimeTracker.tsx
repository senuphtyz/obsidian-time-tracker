import React from "react";
import "./TimeTracker.scss";
import { Clock } from "lucide-react";
import { TimeTrackerState } from "./TimeTrackerState";

export interface TimeTrackerProps {
  onClick: () => void;
}

export const TimeTracker = (props: TimeTrackerProps) => {
  return (
    <div className="time-tracker">
      <div className="info-panels">
        <div className="panel">
          <Clock size={40} />
          <div className="text">
            <span>Worked this week</span>
            <span className="time">08:32</span>
          </div>
        </div>
        <div className="panel">
          <Clock size={40} />
          <div className="text">
            <span>Worked this month</span>
            <span className="time">120:32</span>
          </div>
        </div>
      </div>

      <div className="control">
        {/* <div className="time-list">
          <div className="item">
            <Play size={14} />
            <span>08:00</span>
          </div>
          <div className="item">
            <AlarmClockMinus size={14} />
            <span>12:00</span>
          </div>
          <div className="item">
            <AlarmClockPlus size={14} />
            <span>13:00</span>
          </div>
          <div className="item">
            <Square size={14} />
            <span>17:00</span>
          </div>
        </div> */}
        <TimeTrackerState time="08:32" onClick={() => props.onClick()} />
      </div>
    </div>
  )
}