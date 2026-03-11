import React from "react";
import "./WidgetSkeleton.css";

interface WidgetSkeletonProps {
  width: number;
  height: number;
}

/** Минимальный скелетон для Suspense fallback — без анимации, плавное появление */
const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ width, height }) => {
  return (
    <div
      className="widget-skeleton"
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
};

export default WidgetSkeleton;
