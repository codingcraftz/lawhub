// src/app/layout.js

import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import Header from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "next-themes";
import "./layout.css";
import { Nanum_Gothic } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";
import Footer from "@/components/Footer";

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
      <body className={`${nanumGothic.className} root-portal`}>
        <UserProvider>
          <ThemeProvider attribute="class">
            <Theme
              accentColor="blue"
              grayColor="sand"
              radius="medium"
              style={{ minHeight: "100vh" }}
            >
              <Header />

              <div
                style={{
                  flex: 1,
                  backgroundColor: "var(--gray-2)",
                  width: "100%",
                }}
              >
                {children}
              </div>
              <Footer />
            </Theme>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
