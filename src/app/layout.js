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

const APP_NAME = "PWA App";
const APP_DEFAULT_TITLE = "My Awesome PWA App";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Best PWA app in the world!";

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#FFFFFF",
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
