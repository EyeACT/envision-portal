// auth.d.ts
declare module "#auth-utils" {
  interface User {
    username: string;
  }

  interface UserSession {
    userSessionField: string;
  }

  interface SecureSessionData {
    secureSessionField: string;
  }
}

export {};
