import "@radix-ui/themes/styles.css";
import { Flex, Theme } from "@radix-ui/themes";
import Header from "@/components/Header";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "next-themes";
import "./layout.css";
import { Nanum_Gothic } from "next/font/google";

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
    <html lang="ko" className={nanumGothic.className}>
      <body>
        <UserProvider>
          <ThemeProvider attribute="class">
            <Theme
              accentColor="blue"
              grayColor="sand"
              radius="medium"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
              }}
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
