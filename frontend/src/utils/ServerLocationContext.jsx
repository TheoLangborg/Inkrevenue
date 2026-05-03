import { createContext, useContext } from "react";

export const ServerLocationContext = createContext(null);

export function useServerLocation() {
  return useContext(ServerLocationContext);
}
