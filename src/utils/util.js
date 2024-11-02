export const getCategoryColor = (category) => {
  const colors = {
    민사: { backgroundColor: "var(--sky-3)", color: "var(--sky-12)" },
    형사: { backgroundColor: "var(--red-3)", color: "var(--red-12)" },
    집행: { backgroundColor: "var(--green-3)", color: "var(--green-12)" },
    파산: { backgroundColor: "var(--orange-3)", color: "var(--orange-12)" },
    회생: { backgroundColor: "var(--purple-3)", color: "var(--purple-12)" },
    비송: { backgroundColor: "var(--yellow-3)", color: "var(--yellow-12)" },
  };
  return (
    colors[category] || {
      backgroundColor: "var(--gray-3)",
      color: "var(--gray-12)",
    }
  );
};

export function getClientRoleColor(role) {
  switch (role) {
    case "원고":
      return "var(--red-9)";
    case "피고":
      return "var(--blue-9)";
    case "신청인":
      return "var(--green-9)";
    case "피신청인":
      return "var(--orange-9)";
    case "고소인":
      return "var(--purple-9)";
    case "피고소인":
      return "var(--teal-9)";
    case "채권자":
      return "var(--yellow-9)";
    case "채무자":
      return "var(--gray-9)";
    default:
      return "var(--black)";
  }
}
