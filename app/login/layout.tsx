import ThemeToggle from '@/components/ThemeToggle';

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
