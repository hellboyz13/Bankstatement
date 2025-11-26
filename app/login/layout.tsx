'use client';

import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeToggle />
      {children}
    </>
  );
}
