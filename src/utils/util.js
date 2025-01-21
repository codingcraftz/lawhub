export const formatPhoneNumber = (phoneNumber) => {
	if (!phoneNumber) return "없음";
	return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
};

const getDate = (date) => (date === "dynamic" ? new Date() : new Date(date));

export const calculateExpenses = (expensesData) =>
	expensesData
		? expensesData.reduce(
			(sum, expense) => sum + parseFloat(expense.amount || 0),
			0,
		) || 0
		: 0;

export const calculateInterest = (principal, rate, startDate, endDate) => {
	if (!startDate || !endDate || isNaN(principal) || isNaN(rate)) return 0;
	const start = getDate(startDate).getTime();
	const end = getDate(endDate).getTime();
	const durationInYears = (end - start) / (1000 * 60 * 60 * 24 * 365.25);

	return principal * (rate / 100) * Math.max(durationInYears, 0) || 0;
};

export const getTypeColor = (type) => {
	switch (type) {
		case "요청":
			return "bg-yellow-200 text-yellow-900";
		case "요청완료":
			return "bg-blue-200 text-blue-900";
		case "완료":
			return "bg-gray-200 text-gray-900";
		case "상담":
			return "bg-purple-200 text-purple-900";
		case "접수":
			return "bg-green-200 text-green-900";
		default:
			return "bg-gray-200 text-gray-900";
	}
};

export const formatDate = (date) => {
	if (!date) return "";
	const parsedDate = getDate(date);
	return parsedDate.toISOString().split("T")[0];
};

export const formattedEndDate = (date) => {
	if (!date) return "미등록";
	return date === "dynamic" ? formatDate(new Date()) : formatDate(date);
};

export const getCategoryColor = (category) => {
	const colors = {
		민사: { backgroundColor: "var(--sky-3)", color: "var(--sky-12)" },
		형사: { backgroundColor: "var(--red-3)", color: "var(--red-12)" },
		집행: { backgroundColor: "var(--green-3)", color: "var(--green-12)" },
		파산: { backgroundColor: "var(--orange-3)", color: "var(--orange-12)" },
		회생: { backgroundColor: "var(--purple-3)", color: "var(--purple-12)" },
		비송: { backgroundColor: "var(--yellow-3)", color: "var(--yellow-12)" },
		가사: { backgroundColor: "var(--teal-3)", color: "var(--teal-12)" },
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

export const CASE_CATEGORIES = [
	{ id: "2624cb63-0e85-4718-9bfe-e862c48f644f", name: "형사" },
	{ id: "3b7533ca-eb4f-48d7-bcb6-7d9453a3b674", name: "가사" },
	{ id: "6e503815-4bde-46b6-9d7c-86a95a00e2d9", name: "비송" },
	{ id: "822561a3-518b-49a1-adce-4eee49f3b2f1", name: "회생" },
	{ id: "92d0978e-2d45-49c3-93b9-e0dfa5d1c325", name: "집행" },
	{ id: "aea55ab8-cecc-42d7-88a6-28eb8a4a1c07", name: "민사" },
	{ id: "e7999ab1-2463-40ed-903f-64c51bda7bd7", name: "파산" },
];

export const COURT_LIST = [
	{
		id: 1,
		name: "대법원",
		city: "대법",
	},
	{
		id: 2,
		name: "서울고등법원",
		city: "서울",
	},
	{
		id: 3,
		name: "서울중앙지방법원",
		city: "서울",
	},
	{
		id: 4,
		name: "서울남부지방법원",
		city: "서울",
	},
	{
		id: 5,
		name: "서울동부지방법원",
		city: "서울",
	},
	{
		id: 6,
		name: "서울북부지방법원",
		city: "서울",
	},
	{
		id: 7,
		name: "서울서부지방법원",
		city: "서울",
	},
	{
		id: 8,
		name: "서울가정법원",
		city: "서울",
	},
	{
		id: 9,
		name: "서울행정법원",
		city: "서울",
	},
	{
		id: 10,
		name: "서울회생법원",
		city: "서울",
	},
	{
		id: 11,
		name: "법원공무원교육원",
		city: "법원",
	},
	{
		id: 12,
		name: "법원도서관",
		city: "법원",
	},
	{
		id: 13,
		name: "법원행정처",
		city: "법원",
	},
	{
		id: 14,
		name: "인천지방법원",
		city: "인천",
	},
	{
		id: 15,
		name: "인천지방법원 강화군법원",
		city: "인천",
	},
	{
		id: 16,
		name: "인천지방법원 부천지원",
		city: "인천",
	},
	{
		id: 17,
		name: "인천지방법원 부천지원 김포시법원",
		city: "인천",
	},
	{
		id: 18,
		name: "인천가정법원",
		city: "인천",
	},
	{
		id: 19,
		name: "수원고등법원",
		city: "수원",
	},
	{
		id: 20,
		name: "수원지방법원",
		city: "수원",
	},
	{
		id: 21,
		name: "수원지방법원 성남지원",
		city: "수원",
	},
	{
		id: 22,
		name: "수원지방법원 성남지원 광주시법원",
		city: "수원",
	},
	{
		id: 23,
		name: "수원지방법원 안산지원",
		city: "수원",
	},
	{
		id: 24,
		name: "수원지방법원 안산지원 광명시법원",
		city: "수원",
	},
	{
		id: 25,
		name: "수원지방법원 안양지원",
		city: "수원",
	},
	{
		id: 26,
		name: "수원지방법원 여주지원",
		city: "수원",
	},
	{
		id: 27,
		name: "수원지방법원 여주지원 양평군법원",
		city: "수원",
	},
	{
		id: 28,
		name: "수원지방법원 여주지원 이천시법원",
		city: "수원",
	},
	{
		id: 29,
		name: "수원지방법원 오산시법원",
		city: "수원",
	},
	{
		id: 30,
		name: "수원지방법원 용인시법원",
		city: "수원",
	},
	{
		id: 31,
		name: "수원지방법원 평택지원",
		city: "수원",
	},
	{
		id: 32,
		name: "수원지방법원 평택지원 안성시법원",
		city: "수원",
	},
	{
		id: 33,
		name: "의정부지방법원",
		city: "의정",
	},
	{
		id: 34,
		name: "의정부지방법원 고양지원",
		city: "의정",
	},
	{
		id: 35,
		name: "의정부지방법원 고양지원 파주시법원",
		city: "의정",
	},
	{
		id: 36,
		name: "의정부지방법원 남양주지원",
		city: "의정",
	},
	{
		id: 37,
		name: "의정부지방법원 남양주지원 가평군법원",
		city: "의정",
	},
	{
		id: 38,
		name: "의정부지방법원 동두천시법원",
		city: "의정",
	},
	{
		id: 39,
		name: "의정부지방법원 연천군법원",
		city: "의정",
	},
	{
		id: 40,
		name: "의정부지방법원 철원군법원",
		city: "의정",
	},
	{
		id: 41,
		name: "의정부지방법원 포천시법원",
		city: "의정",
	},
	{
		id: 42,
		name: "사법연수원",
		city: "사법",
	},
	{
		id: 43,
		name: "춘천지방법원",
		city: "춘천",
	},
	{
		id: 44,
		name: "춘천지방법원 강릉지원",
		city: "춘천",
	},
	{
		id: 45,
		name: "춘천지방법원 강릉지원 동해시법원",
		city: "춘천",
	},
	{
		id: 46,
		name: "춘천지방법원 강릉지원 삼척시법원",
		city: "춘천",
	},
	{
		id: 47,
		name: "춘천지방법원 속초지원",
		city: "춘천",
	},
	{
		id: 48,
		name: "춘천지방법원 속초지원 고성군법원",
		city: "춘천",
	},
	{
		id: 49,
		name: "춘천지방법원 속초지원 양양군법원",
		city: "춘천",
	},
	{
		id: 50,
		name: "춘천지방법원 양구군법원",
		city: "춘천",
	},
	{
		id: 51,
		name: "춘천지방법원 영월지원",
		city: "춘천",
	},
	{
		id: 52,
		name: "춘천지방법원 영월지원 정선군법원",
		city: "춘천",
	},
	{
		id: 53,
		name: "춘천지방법원 영월지원 태백시법원",
		city: "춘천",
	},
	{
		id: 54,
		name: "춘천지방법원 영월지원 평창군법원",
		city: "춘천",
	},
	{
		id: 55,
		name: "춘천지방법원 원주지원",
		city: "춘천",
	},
	{
		id: 56,
		name: "춘천지방법원 원주지원 횡성군법원",
		city: "춘천",
	},
	{
		id: 57,
		name: "춘천지방법원 인제군법원",
		city: "춘천",
	},
	{
		id: 58,
		name: "춘천지방법원 홍천군법원",
		city: "춘천",
	},
	{
		id: 59,
		name: "춘천지방법원 화천군법원",
		city: "춘천",
	},
	{
		id: 60,
		name: "청주지방법원",
		city: "청주",
	},
	{
		id: 61,
		name: "청주지방법원 괴산군법원",
		city: "청주",
	},
	{
		id: 62,
		name: "청주지방법원 보은군법원",
		city: "청주",
	},
	{
		id: 63,
		name: "청주지방법원 영동지원",
		city: "청주",
	},
	{
		id: 64,
		name: "청주지방법원 영동지원 옥천군법원",
		city: "청주",
	},
	{
		id: 65,
		name: "청주지방법원 제천지원",
		city: "청주",
	},
	{
		id: 66,
		name: "청주지방법원 제천지원 단양군법원",
		city: "청주",
	},
	{
		id: 67,
		name: "청주지방법원 진천군법원",
		city: "청주",
	},
	{
		id: 68,
		name: "청주지방법원 충주지원",
		city: "청주",
	},
	{
		id: 69,
		name: "청주지방법원 충주지원 음성군법원",
		city: "청주",
	},
	{
		id: 70,
		name: "대전고등법원",
		city: "대전",
	},
	{
		id: 71,
		name: "대전지방법원",
		city: "대전",
	},
	{
		id: 72,
		name: "대전지방법원 공주지원",
		city: "대전",
	},
	{
		id: 73,
		name: "대전지방법원 공주지원 청양군법원",
		city: "대전",
	},
	{
		id: 74,
		name: "대전지방법원 금산군법원",
		city: "대전",
	},
	{
		id: 75,
		name: "대전지방법원 논산지원",
		city: "대전",
	},
	{
		id: 76,
		name: "대전지방법원 논산지원 부여군법원",
		city: "대전",
	},
	{
		id: 77,
		name: "대전지방법원 서산지원",
		city: "대전",
	},
	{
		id: 78,
		name: "대전지방법원 서산지원 당진시법원",
		city: "대전",
	},
	{
		id: 79,
		name: "대전지방법원 서산지원 태안군법원",
		city: "대전",
	},
	{
		id: 80,
		name: "대전지방법원 세종특별자치시법원",
		city: "대전",
	},
	{
		id: 81,
		name: "대전지방법원 천안지원",
		city: "대전",
	},
	{
		id: 82,
		name: "대전지방법원 천안지원 아산시법원",
		city: "대전",
	},
	{
		id: 83,
		name: "대전지방법원 홍성지원",
		city: "대전",
	},
	{
		id: 84,
		name: "대전지방법원 홍성지원 보령시법원",
		city: "대전",
	},
	{
		id: 85,
		name: "대전지방법원 홍성지원 서천군법원",
		city: "대전",
	},
	{
		id: 86,
		name: "대전지방법원 홍성지원 예산군법원",
		city: "대전",
	},
	{
		id: 87,
		name: "대전가정법원",
		city: "대전",
	},
	{
		id: 88,
		name: "대전가정법원 공주지원",
		city: "대전",
	},
	{
		id: 89,
		name: "대전가정법원 논산지원",
		city: "대전",
	},
	{
		id: 90,
		name: "대전가정법원 서산지원",
		city: "대전",
	},
	{
		id: 91,
		name: "대전가정법원 천안지원",
		city: "대전",
	},
	{
		id: 92,
		name: "대전가정법원 홍성지원",
		city: "대전",
	},
	{
		id: 93,
		name: "특허법원 [대전]",
		city: "특허",
	},
	{
		id: 94,
		name: "대구고등법원",
		city: "대구",
	},
	{
		id: 95,
		name: "대구지방법원",
		city: "대구",
	},
	{
		id: 96,
		name: "대구지방법원 경산시법원",
		city: "대구",
	},
	{
		id: 97,
		name: "대구지방법원 경주지원",
		city: "대구",
	},
	{
		id: 98,
		name: "대구지방법원 서부지원 고령군법원",
		city: "대구",
	},
	{
		id: 99,
		name: "대구지방법원 김천지원",
		city: "대구",
	},
	{
		id: 100,
		name: "대구지방법원 김천지원 구미시법원",
		city: "대구",
	},
	{
		id: 101,
		name: "대구지방법원 상주지원",
		city: "대구",
	},
	{
		id: 102,
		name: "대구지방법원 상주지원 문경시법원",
		city: "대구",
	},
	{
		id: 103,
		name: "대구지방법원 상주지원 예천군법원",
		city: "대구",
	},
	{
		id: 104,
		name: "대구지방법원 서부지원",
		city: "대구",
	},
	{
		id: 105,
		name: "대구지방법원 서부지원 성주군법원",
		city: "대구",
	},
	{
		id: 106,
		name: "대구지방법원 안동지원",
		city: "대구",
	},
	{
		id: 107,
		name: "대구지방법원 안동지원 봉화군법원",
		city: "대구",
	},
	{
		id: 108,
		name: "대구지방법원 안동지원 영주시법원",
		city: "대구",
	},
	{
		id: 109,
		name: "대구지방법원 영덕지원",
		city: "대구",
	},
	{
		id: 110,
		name: "대구지방법원 영덕지원 영양군법원",
		city: "대구",
	},
	{
		id: 111,
		name: "대구지방법원 영덕지원 울진군법원",
		city: "대구",
	},
	{
		id: 112,
		name: "대구지방법원 영천시법원",
		city: "대구",
	},
	{
		id: 113,
		name: "대구지방법원 의성지원",
		city: "대구",
	},
	{
		id: 114,
		name: "대구지방법원 의성지원 군위군법원",
		city: "대구",
	},
	{
		id: 115,
		name: "대구지방법원 의성지원 청송군법원",
		city: "대구",
	},
	{
		id: 116,
		name: "대구지방법원 청도군법원",
		city: "대구",
	},
	{
		id: 117,
		name: "대구지방법원 포항지원",
		city: "대구",
	},
	{
		id: 118,
		name: "대구지방법원 칠곡군법원",
		city: "대구",
	},
	{
		id: 119,
		name: "대구가정법원",
		city: "대구",
	},
	{
		id: 120,
		name: "대구가정법원 경주지원",
		city: "대구",
	},
	{
		id: 121,
		name: "대구가정법원 김천지원",
		city: "대구",
	},
	{
		id: 122,
		name: "대구가정법원 상주지원",
		city: "대구",
	},
	{
		id: 123,
		name: "대구가정법원 안동지원",
		city: "대구",
	},
	{
		id: 124,
		name: "대구가정법원 영덕지원",
		city: "대구",
	},
	{
		id: 125,
		name: "대구가정법원 의성지원",
		city: "대구",
	},
	{
		id: 126,
		name: "대구가정법원 포항지원",
		city: "대구",
	},
	{
		id: 127,
		name: "광주고등법원",
		city: "광주",
	},
	{
		id: 128,
		name: "광주고등법원 원외재판부",
		city: "광주",
	},
	{
		id: 129,
		name: "광주고등법원 원외재판부",
		city: "광주",
	},
	{
		id: 130,
		name: "광주지방법원",
		city: "광주",
	},
	{
		id: 131,
		name: "광주지방법원 목포지원",
		city: "광주",
	},
	{
		id: 132,
		name: "광주지방법원 장흥지원",
		city: "광주",
	},
	{
		id: 133,
		name: "광주지방법원 순천지원",
		city: "광주",
	},
	{
		id: 134,
		name: "광주지방법원 해남지원",
		city: "광주",
	},
	{
		id: 135,
		name: "광주가정법원",
		city: "광주",
	},
	{
		id: 136,
		name: "광주가정법원 장흥지원",
		city: "광주",
	},
	{
		id: 137,
		name: "광주가정법원 순천지원",
		city: "광주",
	},
	{
		id: 138,
		name: "광주가정법원 해남지원",
		city: "광주",
	},
	{
		id: 139,
		name: "광주가정법원 목포지원",
		city: "광주",
	},
	{
		id: 140,
		name: "광주지방법원 곡성군법원",
		city: "광주",
	},
	{
		id: 141,
		name: "광주지방법원 영광군법원",
		city: "광주",
	},
	{
		id: 142,
		name: "광주지방법원 나주시법원",
		city: "광주",
	},
	{
		id: 143,
		name: "광주지방법원 장성군법원",
		city: "광주",
	},
	{
		id: 144,
		name: "광주지방법원 화순군법원",
		city: "광주",
	},
	{
		id: 145,
		name: "광주지방법원 담양군법원",
		city: "광주",
	},
	{
		id: 146,
		name: "광주지방법원 목포지원 함평군법원",
		city: "광주",
	},
	{
		id: 147,
		name: "광주지방법원 목포지원 영암군법원",
		city: "광주",
	},
	{
		id: 148,
		name: "광주지방법원 목포지원 무안군법원",
		city: "광주",
	},
	{
		id: 149,
		name: "광주지방법원 장흥지원 강진군법원",
		city: "광주",
	},
	{
		id: 150,
		name: "광주지방법원 순천지원 보성군법원",
		city: "광주",
	},
	{
		id: 151,
		name: "광주지방법원 순천지원 고흥군법원",
		city: "광주",
	},
	{
		id: 152,
		name: "광주지방법원 순천지원 여수시법원",
		city: "광주",
	},
	{
		id: 153,
		name: "광주지방법원 순천지원 구례군법원",
		city: "광주",
	},
	{
		id: 154,
		name: "광주지방법원 순천지원 광양시법원",
		city: "광주",
	},
	{
		id: 155,
		name: "광주지방법원 해남지원 완도군법원",
		city: "광주",
	},
	{
		id: 156,
		name: "광주지방법원 해남지원 진도군법원",
		city: "광주",
	},
	{
		id: 157,
		name: "창원지방법원",
		city: "창원",
	},
	{
		id: 158,
		name: "창원지방법원 거창지원",
		city: "창원",
	},
	{
		id: 159,
		name: "창원지방법원 거창지원 함양군법원",
		city: "창원",
	},
	{
		id: 160,
		name: "창원지방법원 거창지원 합천군법원",
		city: "창원",
	},
	{
		id: 161,
		name: "창원지방법원 김해시법원",
		city: "창원",
	},
	{
		id: 162,
		name: "창원지방법원 마산지원",
		city: "창원",
	},
	{
		id: 163,
		name: "창원지방법원 마산지원 의령군법원",
		city: "창원",
	},
	{
		id: 164,
		name: "창원지방법원 마산지원 함안군법원",
		city: "창원",
	},
	{
		id: 165,
		name: "창원지방법원 밀양지원",
		city: "창원",
	},
	{
		id: 166,
		name: "창원지방법원 밀양지원 창녕군법원",
		city: "창원",
	},
	{
		id: 167,
		name: "창원지방법원 진주지원",
		city: "창원",
	},
	{
		id: 168,
		name: "창원지방법원 진주지원 남해군법원",
		city: "창원",
	},
	{
		id: 169,
		name: "창원지방법원 진주지원 사천시법원",
		city: "창원",
	},
	{
		id: 170,
		name: "창원지방법원 진주지원 산청군법원",
		city: "창원",
	},
	{
		id: 171,
		name: "창원지방법원 진주지원 하동군법원",
		city: "창원",
	},
	{
		id: 172,
		name: "창원지방법원 창원남부시법원",
		city: "창원",
	},
	{
		id: 173,
		name: "창원지방법원 통영지원",
		city: "창원",
	},
	{
		id: 174,
		name: "창원지방법원 통영지원 거제시법원",
		city: "창원",
	},
	{
		id: 175,
		name: "창원지방법원 통영지원 고성군법원",
		city: "창원",
	},
	{
		id: 176,
		name: "울산지방법원",
		city: "울산",
	},
	{
		id: 177,
		name: "울산지방법원 양산시법원",
		city: "울산",
	},
	{
		id: 178,
		name: "전주지방법원",
		city: "전주",
	},
	{
		id: 179,
		name: "전주지방법원 군산지원",
		city: "전주",
	},
	{
		id: 180,
		name: "전주지방법원 군산지원 익산시법원",
		city: "전주",
	},
	{
		id: 181,
		name: "전주지방법원 김제시법원",
		city: "전주",
	},
	{
		id: 182,
		name: "전주지방법원 남원지원",
		city: "전주",
	},
	{
		id: 183,
		name: "전주지방법원 남원지원 순창군법원",
		city: "전주",
	},
	{
		id: 184,
		name: "전주지방법원 남원지원 장수군법원",
		city: "전주",
	},
	{
		id: 185,
		name: "전주지방법원 무주군법원",
		city: "전주",
	},
	{
		id: 186,
		name: "전주지방법원 임실군법원",
		city: "전주",
	},
	{
		id: 187,
		name: "전주지방법원 정읍지원",
		city: "전주",
	},
	{
		id: 188,
		name: "전주지방법원 정읍지원 고창군법원",
		city: "전주",
	},
	{
		id: 189,
		name: "전주지방법원 정읍지원 부안군법원",
		city: "전주",
	},
	{
		id: 190,
		name: "전주지방법원 진안군법원",
		city: "전주",
	},
	{
		id: 191,
		name: "부산고등법원",
		city: "부산",
	},
	{
		id: 192,
		name: "부산고등법원 원외재판부",
		city: "부산",
	},
	{
		id: 193,
		name: "부산지방법원",
		city: "부산",
	},
	{
		id: 194,
		name: "부산지방법원 동부지원",
		city: "부산",
	},
	{
		id: 195,
		name: "부산지방법원 서부지원",
		city: "부산",
	},
	{
		id: 196,
		name: "부산가정법원",
		city: "부산",
	},
	{
		id: 197,
		name: "제주지방법원",
		city: "제주",
	},
	{
		id: 198,
		name: "제주지방법원 서귀포시법원",
		city: "제주",
	},
];


export const formatToKoreaTime = (dateString) => {
	// UTC 날짜 문자열을 Date 객체로 변환
	const utcDate = new Date(dateString);

	// 한국 시간으로 변환 (UTC+9)
	const koreaTime = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

	// 한국 시간 형식으로 출력
	return koreaTime.toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true, // 12시간 형식 (오전/오후)
	});
}

