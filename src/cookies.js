export function getCookie(name, debug_mode = false) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        if (debug_mode) {
          console.log("getCookie(): found ", cookieValue, "for cookie", name);
        }
        break;
      }
    }
  }
  if (debug_mode && !cookieValue) {
    console.warn("getCookie(): no value found for", name);
  }
  return cookieValue;
}

export function setSessionCookie(
  session_key,
  debug_mode = false,
  sessionCookieName,
  sessionCookieExpiration,
) {
  const currentPath = window.location.pathname;
  if (session_key) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + sessionCookieExpiration);
    const expires = expirationDate.toUTCString();
    const cookieData = `${sessionCookieName}=${session_key}; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (debug_mode) {
      console.log(
        "setSessionCookie(): ",
        cookieData,
        "now: ",
        new Date().toUTCString(),
        "expiration: ",
        expirationDate.toUTCString(),
      );
    }
  } else {
    // Unset the cookie by setting its expiration date to the past
    const expirationDate = new Date(0);
    const expires = expirationDate.toUTCString();
    const cookieData = `${sessionCookieName}=; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (debug_mode) {
      console.log("setSessionCookie(): Unsetting cookie", cookieData);
    }
  }
}

export function setDebugCookie(
  debug_mode,
  debugCookieExpiration,
  debugCookieName,
) {
  debug_mode = debug_mode || false;
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + debugCookieExpiration);
  const expires = `expires=${expirationDate.toUTCString()}`;

  document.cookie = `${debugCookieName}=${debug_mode}; path=/; SameSite=Lax; ${expires}`;

  if (debug_mode) {
    console.log("setDebugCookie(): ", debug_mode);
  }
}
