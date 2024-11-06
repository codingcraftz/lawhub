import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">개인정보 처리방침</h1>
      <p className="mb-4">
        LawHub은(는) 개인정보 보호법 제30조에 따라 고객의 개인정보를 보호하고
        이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과
        같은 처리방침을 두고 있습니다.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. 수집하는 개인정보의 항목
      </h2>
      <p>LawHub은(는) 다음의 개인정보 항목을 처리하고 있습니다:</p>
      <ul className="list-disc list-inside mb-4">
        <li>이메일</li>
        <li>이름</li>
        <li>전화번호</li>
        <li>생년월일</li>
        <li>성별</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. 개인정보의 수집 및 이용 목적
      </h2>
      <p>LawHub은(는) 수집한 개인정보를 다음의 목적을 위해 이용합니다:</p>
      <ul className="list-disc list-inside mb-4">
        <li>회원 가입 및 관리</li>
        <li>고객 상담 및 서비스 제공</li>
        <li>법적 의무 이행 및 기타 서비스 이용</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. 개인정보의 보유 및 이용 기간
      </h2>
      <p>
        LawHub은(는) 법령에 따른 개인정보 보유 및 이용 기간 또는 정보주체로부터
        개인정보를 수집 시에 동의 받은 개인정보 보유 및 이용 기간 내에서
        개인정보를 처리합니다.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. 개인정보의 파기</h2>
      <p>
        개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게
        되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
