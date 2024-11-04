// src/utils/password-reset.js

export const absoluteUrl = (path) =>
  `${process.env.NEXT_PUBLIC_SITE_URL}${path}`;

export const Routes = {
  home: "/",
  passwordReset: "/reset-password",
};
