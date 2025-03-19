/*-----------------------------------------------------------------------------
 Description: cookie management functions for the SmarterChat application.
-----------------------------------------------------------------------------*/
export function getCookie(cookie, defaultValue = null) {
  if (cookie.value !== null) {
    return cookie.value;
  }
  let cookieValue = null;

  if (window.location.hostname.endsWith(cookie.domain) && document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    for (let i = 0; i < cookies.length; i++) {
      const thisCookie = cookies[i];
      if (thisCookie.startsWith(`${cookie.name}=`)) {
        cookieValue = decodeURIComponent(thisCookie.substring(cookie.name.length + 1));
        break;
      }
    }
  }

  return cookieValue || defaultValue;
}

export function setCookie(cookie, value) {
  const currentPath = window.location.pathname;
  if (value) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + cookie.expiration);
    const expires = expirationDate.toUTCString();
    const cookieData = `${cookie.name}=${value}; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
  } else {
    // Unset the cookie by setting its expiration date to the past
    const expirationDate = new Date(0);
    const expires = expirationDate.toUTCString();
    const cookieData = `${cookie.name}=; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
  }
}

export function cookieMetaFactory(cookieName, cookieExpiration, cookieDomain, cookieValue = null) {
  /*
  Create a cookie object.
   */
  return {
    name: cookieName,
    expiration: cookieExpiration,
    domain: cookieDomain,
    value: cookieValue,
  };
}
