import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Redirect stub: /library/yoga-sutras → /library/upanishads
 * This file exists to prevent "Unmatched Route" errors from any saved
 * navigation or deep links pointing to this path.
 */
export default function YogaSutrasRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/library/upanishads' as any);
  }, [router]);

  return null;
}
