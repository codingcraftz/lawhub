import * as yup from "yup";

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  password: yup.string().required("비밀번호는 필수입니다"),
});

export const passwordResetSchema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
});

export const signupSchema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  name: yup.string().required("이름은 필수입니다"),
  phoneNumber: yup
    .string()
    .matches(/^[0-9]{10,11}$/, "전화번호는 10~11자리의 숫자만 입력해주세요")
    .required("전화번호는 필수입니다"),
  password: yup
    .string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d가-힣!@#$%^&*]{8,}$/,
      "비밀번호는 최소 8자 이상이며, 영문자와 숫자를 포함해야 합니다",
    )
    .required("비밀번호는 필수입니다"),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password"), null], "비밀번호가 일치하지 않습니다")
    .required("비밀번호 확인은 필수입니다"),
  birthDate: yup
    .date()
    .nullable()
    .typeError("유효한 날짜를 입력해주세요")
    .required("생년월일은 필수입니다"),
  gender: yup
    .string()
    .oneOf(["male", "female", "other"], "유효한 성별을 선택해주세요")
    .required("성별은 필수입니다"),
  agreeTerms: yup
    .boolean()
    .oneOf([true], "이용약관 및 개인정보 처리방침에 동의해야 합니다"),
});
