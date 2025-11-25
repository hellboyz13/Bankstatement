import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GlobalThemeToggle from "@/components/GlobalThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Statement Analyzer",
  description: "Analyze and categorize your bank transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {
                console.error('Theme initialization failed:', e);
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <GlobalThemeToggle />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
