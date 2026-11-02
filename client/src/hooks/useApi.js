import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Loads data from a GET endpoint and re-loads whenever the path or query changes.
// Returns { data, error, loading, reload }.
//
// Each result is saved together with the "key" (path + query) it was fetched for.
// `loading` is simply "the saved result is not for the current key yet", so we
// never have to set loading=true by hand.
export function useApi(path, query) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const queryKey = JSON.stringify(query ?? {});
  const requestKey = `${path}?${queryKey}#${reloadCount}`;

  useEffect(() => {
    // If the user changes page/search before this request finishes, ignore its
    // answer — otherwise an older, slower response could overwrite a newer one.
    let ignore = false;
    api
      .get(path, JSON.parse(queryKey))
      .then((json) => !ignore && setResult({ key: requestKey, data: json.data, error: null }))
      .catch((error) => !ignore && setResult({ key: requestKey, data: null, error }));
    return () => {
      ignore = true;
    };
  }, [path, queryKey, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: result.data,
    error: result.key === requestKey ? result.error : null,
    loading: result.key !== requestKey,
    reload,
  };
}
