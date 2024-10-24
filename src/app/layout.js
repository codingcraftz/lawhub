// src/app/layout.js

import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import Header from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "next-themes";
import "./layout.css";
import { Nanum_Gothic } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";

const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "LawHub",
  description: "Legal management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={nanumGothic.className}>
        <UserProvider>
          <ThemeProvider attribute="class">
            <Theme
              accentColor="blue"
              grayColor="sand"
              radius="medium"
              style={{ minHeight: "100vh" }}
            >
              <Header />
              {children}
            </Theme>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
