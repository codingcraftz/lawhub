// 날짜 포맷
export function formatDate(dateString) {
  if (!dateString) return "";
  if (dateString === "dynamic") return new Date().toLocaleDateString("ko-KR");
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 이자 계산 함수 (동적 날짜 처리 포함)
export function calcInterest(rate, start, end, principal) {
  if (!rate || !start || !end || !principal) return 0;
  const startDate = start === "dynamic" ? new Date() : new Date(start);
  const endDate = end === "dynamic" ? new Date() : new Date(end);
  const diffTime = endDate - startDate;
  const diffYears = diffTime > 0 ? diffTime / (1000 * 3600 * 24 * 365.25) : 0;
  return principal * (parseFloat(rate) / 100) * diffYears;
}

// 채권 원금 총합 (수임원금 + 이자1 + 이자2 + 비용)
export function calculateBondTotal(bond) {
  if (!bond) return 0;
  const principal = parseFloat(bond.principal ?? 0);
  const interest1 = calcInterest(
    bond.interest_1_rate,
    bond.interest_1_start_date,
    bond.interest_1_end_date,
    principal,
  );
  const interest2 = calcInterest(
    bond.interest_2_rate,
    bond.interest_2_start_date,
    bond.interest_2_end_date,
    principal,
  );
  const totalExpenses = Array.isArray(bond.expenses)
    ? bond.expenses.reduce((sum, ex) => sum + parseFloat(ex.amount || 0), 0)
    : 0;

  return principal + interest1 + interest2 + totalExpenses;
}
