import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function useOnlineStatus(): { isOnline: boolean; isWifi: boolean } {
  const [isOnline, setIsOnline] = useState(true);
  const [isWifi, setIsWifi] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
      setIsWifi(state.type === "wifi");
    });
    return () => unsubscribe();
  }, []);

  return { isOnline, isWifi };
}
