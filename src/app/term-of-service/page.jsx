import React from "react";

const TermsOfService = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">이용약관</h1>
      <p className="mb-4">
        본 약관은 LawHub(이하 &quot;회사&quot;)가 제공하는 서비스(이하
        &quot;서비스&quot;)를 이용함에 있어 회사와 이용자의 권리, 의무 및
        책임사항 등을 규정함을 목적으로 합니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. 목적</h2>
      <p>
        본 약관은 회사가 제공하는 서비스의 이용 조건 및 절차, 회사와 이용자 간의
        권리, 의무 및 기타 필요한 사항을 규정합니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. 용어의 정의</h2>
      <ul className="list-disc list-inside mb-4">
        <li>
          &quot;서비스&quot;란 회사가 제공하는 온라인 서비스를 의미합니다.
        </li>
        <li>
          &quot;이용자&quot;란 회사의 서비스에 접속하여 본 약관에 따라 회사가
          제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
        </li>
        <li>
          &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서,
          회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를
          계속적으로 이용할 수 있는 자를 말합니다.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. 약관의 효력 및 변경
      </h2>
      <p>
        본 약관은 이용자가 회원 가입 시 동의함으로써 효력이 발생합니다. 회사는
        관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있으며, 변경된
        약관은 서비스 화면에 공지하거나 이메일을 통해 고지합니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. 회원 가입 및 관리</h2>
      <p>
        이용자는 회사가 정한 절차에 따라 회원가입을 신청하며, 회사는 이에 대해
        승낙할 수 있습니다. 이용자는 회원정보에 변경이 발생할 경우, 즉시 회사에
        알려야 합니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. 개인정보 보호</h2>
      <p>
        회사는 이용자의 개인정보를 보호하기 위해 관련 법령이 정하는 바에 따라
        개인정보처리방침을 운영합니다. 이용자의 개인정보는 본 서비스의 운영을
        위한 목적 외에 사용되지 않으며, 제3자에게 제공되지 않습니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. 서비스의 제공 및 중단
      </h2>
      <p>
        회사는 이용자에게 서비스를 제공합니다. 다만, 회사의 사정에 따라 서비스의
        제공을 일시적으로 중단할 수 있으며, 이러한 경우 이용자에게 사전
        통지합니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. 이용자의 의무</h2>
      <ul className="list-disc list-inside mb-4">
        <li>이용자는 본 약관 및 관련 법령을 준수해야 합니다.</li>
        <li>
          이용자는 타인의 개인정보를 침해하거나 부정한 목적으로 서비스를
          이용해서는 안 됩니다.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. 손해배상 및 면책</h2>
      <p>
        회사는 서비스 제공과 관련하여 발생하는 손해에 대해 책임지지 않으며,
        이용자가 본 약관을 위반하여 발생한 손해에 대해 회사는 책임을 지지
        않습니다.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. 기타</h2>
      <p>
        본 약관에 명시되지 않은 사항은 관련 법령에 따르며, 본 약관의 해석 및
        적용에 관한 사항은 대한민국 법률에 따릅니다.
      </p>

      <p className="mt-6">본 약관은 2024년 10월 15일부터 적용됩니다.</p>
    </div>
  );
};

export default TermsOfService;
