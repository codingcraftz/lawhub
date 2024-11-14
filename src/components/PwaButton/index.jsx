"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@radix-ui/themes";

export default function PwaButton() {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event); // 설치 프롬프트 이벤트 저장
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt(); // 설치 프롬프트 표시
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("PWA 설치가 완료되었습니다!");
        } else {
          console.log("PWA 설치가 취소되었습니다.");
        }
        setInstallPrompt(null);
      });
    }
  };

  return (
    installPrompt && (
      <Button
        variant="solid"
        size="large"
        onClick={handleInstallClick}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "12px 24px",
          marginTop: "20px",
        }}
      >
        PWA 앱 설치
      </Button>
    )
  );
}
