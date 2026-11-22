import type { Metadata } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "PlanWise",
  description: "Plan on your own. Get it done together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
