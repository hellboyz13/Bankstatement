'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { ThemeProvider } from '@/context/ThemeContext';

export const dynamic = 'force-dynamic';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ThemeToggle />
      {children}
    </ThemeProvider>
  );
}
