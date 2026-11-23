import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";

import "@/styles/globals.css";

const nunitoSans = Nunito_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-nunito-sans" });

export const metadata: Metadata = {
  title: { default: "PlanWise", template: "%s · PlanWise" },
  description: "Plan on your own. Get it done together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
