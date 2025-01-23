import { Play } from "lucide-react";
import { useCallback, useState } from "react";

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
      <Play size={fontSize} />
      <span style={{ fontSize: fontSize }} className="time">{props.time}</span>
    </div>
  );
};