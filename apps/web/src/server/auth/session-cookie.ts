export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires: Date;
}

export interface SessionCookie {
  name: string;
  value: string;
  options: SessionCookieOptions;
}

export function sessionCookieName(isProduction: boolean): string {
  return isProduction ? "__Host-studiocar_session" : "studiocar_session";
}

export function createSessionCookie(
  token: string,
  expires: Date,
  isProduction: boolean,
): SessionCookie {
  return {
    name: sessionCookieName(isProduction),
    value: token,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires,
    },
  };
}

export function clearSessionCookie(isProduction: boolean): SessionCookie {
  return createSessionCookie("", new Date(0), isProduction);
}
