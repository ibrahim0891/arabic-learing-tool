'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quiz');
  }, [router]);

  return null;
}
