const COPY_MESSAGE_TEMPLATE = `안녕하십니까, 채권관리 담당자 박준영입니다.

당사는 귀하가 보유하고 계신 ABC채권을 인수하였으며, 관련하여 채무 상환 안내를 드립니다.

정확한 납부 금액 안내를 위해 본 메시지를 확인하신 후 회신 부탁드립니다. 회신을 주시면 금액을 안내드리겠습니다.

[📌납부 계좌 정보]
은행: 신한은행
계좌번호: 110-401-411058
예금주: 황현기

만약 본 채권에 대한 이의사항이 있으시거나 반대 채권을 보유하신 경우, 반드시 본 메시지로 회신 부탁드립니다.

기한 내 추가적인 변제가 이루어지지 않을 경우, 법적 절차가 진행될 수 있으며, 이에 따른 법적 비용 발생 및 신용상 불이익이 발생할 수 있음을 안내드립니다.

원만한 처리를 위해 신속한 회신을 부탁드립니다.

감사합니다.
`;

export const handleCopy = async (amount) => {
  const formattedAmount = typeof amount === 'number' ? amount.toLocaleString() : amount;
  const message = COPY_MESSAGE_TEMPLATE.replace('{금액}', formattedAmount);
  try {
    await navigator.clipboard.writeText(message);
    toast.success('메시지가 복사되었습니다.');
  } catch (error) {
    toast.error('메시지 복사에 실패했습니다.');
  }
};

export const handleCopyName = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success('메시지가 복사되었습니다.');
  } catch (error) {
    toast.error('메시지 복사에 실패했습니다.');
  }
};

export const getCurrentDateFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};
