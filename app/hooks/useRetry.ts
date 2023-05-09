import { useState, useEffect } from "react";

export function useRetry(numberOfRetries: number) {
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    if (attemptCount >= numberOfRetries) {
      return;
    }

    console.log(`Attempt ${attemptCount + 1} of ${numberOfRetries}...`);

    const retryTimer = setTimeout(() => {
      setAttemptCount(attemptCount + 1);
    }, 15000);

    return () => {
      clearTimeout(retryTimer);
    };
  }, [attemptCount, numberOfRetries]);

  return attemptCount;
}
