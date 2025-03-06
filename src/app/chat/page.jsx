"use client";

const { default: Chatbot } = require("@/components/Chatbot");

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gray-1 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-12 mb-2">
              법률상담 챗봇
            </h1>
            <p className="text-gray-11">
              간단한 질문에 답변하시면, 법률 상담을 도와드립니다. 상세한 상담이
              필요한 경우 변호사와의 1:1 상담을 연결해 드립니다.
            </p>
          </div>

          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
