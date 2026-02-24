import { useEffect, useState } from "react";

export function useRealtimeRefresh() {
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  );

  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return { isDocumentVisible };
}
