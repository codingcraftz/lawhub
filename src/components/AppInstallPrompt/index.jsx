// src/components/AppInstallPrompt.js
import React from "react";

export default function AppInstallPrompt({ onDismiss }) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  const handleInstallClick = () => {
    if (isIOS) {
      alert("Safari에서 '홈 화면에 추가'를 선택해주세요.");
      localStorage.setItem("iosInstalled", "true");
    } else {
      alert("Android 설치 유도 로직을 활용하세요.");
    }
    onDismiss();
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-blue-500 text-white text-center">
      <p>
        {isIOS
          ? "홈 화면에 추가하여 빠르게 접근하세요!"
          : "앱 설치를 원하시면 홈 화면에 추가하세요!"}
      </p>
      <button
        onClick={handleInstallClick}
        className="bg-white text-blue-500 px-4 py-2 mt-2 rounded"
      >
        홈 화면에 추가
      </button>
      <button onClick={onDismiss} className="absolute top-2 right-2 text-white">
        닫기
      </button>
    </div>
  );
}
