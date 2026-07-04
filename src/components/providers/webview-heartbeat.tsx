"use client";

import { useEffect } from "react";

export function WebviewHeartbeat() {
  useEffect(() => {
    const monitorUrl = process.env.NEXT_PUBLIC_WEBVIEW_MONITOR_URL;
    if (!monitorUrl) return;

    const heartbeatUrl = `${monitorUrl}/heartbeat`;

    function ping() {
      fetch(heartbeatUrl, {
        method: "POST",
        cache: "no-store",
        keepalive: true
      }).catch(() => {
        // The launcher may already be closed; the app should not surface this.
      });
    }

    ping();
    const interval = window.setInterval(ping, 2000);

    return () => {
      window.clearInterval(interval);
      navigator.sendBeacon?.(heartbeatUrl);
    };
  }, []);

  return null;
}
