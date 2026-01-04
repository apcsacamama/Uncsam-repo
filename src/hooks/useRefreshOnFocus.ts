import { useEffect } from 'react';

export function useRefreshOnFocus(refetch: () => void) {
  useEffect(() => {
    const onFocus = () => {
      console.log("Tab is active again. Refreshing data...");
      refetch();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [refetch]);
}