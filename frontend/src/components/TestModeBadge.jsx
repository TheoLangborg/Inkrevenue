import { useEffect, useState } from "react";
import { isTestMode, turnOffTestMode } from "../utils/testMode";

// Syns bara i testläget (?test i adressen), så att ingen glömmer att fliken
// visar teststudion. Bara för InkRevenue-teamet, därför bara på svenska.
// Läses efter mount: den prerendrade sidan är alltid utan testläge.
export function TestModeBadge() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isTestMode());
  }, []);

  if (!active) return null;

  const turnOff = () => {
    turnOffTestMode();
    const url = new URL(window.location.href);
    url.searchParams.delete("test");
    window.location.replace(url.toString());
  };

  return (
    <div className="test-mode-badge" role="status">
      <span className="test-mode-badge__dot" aria-hidden="true" />
      Testläge: teststudion visas
      <button type="button" className="test-mode-badge__off" onClick={turnOff}>
        Stäng av
      </button>
    </div>
  );
}
