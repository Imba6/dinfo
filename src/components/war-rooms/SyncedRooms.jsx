import { useRef, useState, useLayoutEffect } from "react";

export default function SyncedRooms({ children }) {
  const refs = useRef([]);
  const [maxWidth, setMaxWidth] = useState(0);

  useLayoutEffect(() => {
    const widths = refs.current.map((el) => el?.offsetWidth || 0);
    setMaxWidth(Math.max(...widths));
  }, [children]);

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {children.map((child, i) => (
        <div
          key={i}
          ref={(el) => (refs.current[i] = el)}
          style={{ width: maxWidth || "auto" }}
          className="flex-shrink-0"
        >
          {child}
        </div>
      ))}
    </div>
  );
}