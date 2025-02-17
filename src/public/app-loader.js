const DEBUG_MODE = true;
/* ----------------------------------------------------------------------------
  SmarterChat app Loader.

  see:
  - https://cdn.platform.smarter.sh/ui-chat/app-loader.js
  - https://cdn.platform.smarter.sh/ui-chat/index.html

  This script is responsible for injecting the Smarter Chat app into the DOM
  of the host website. The chat app is served from AWS Cloudfront.
  Fetches /ui-chat/index.html (the react build artifact), parses the html text,
  and injects the css and js link elements into the head/body of the host website.

  Also adds the class 'smarter-chat' to the injected elements, solely for
  tracking what this script has injected into the DOM.

  example index.html:

    <script class="smarter-chat" type="module" crossorigin src="https://cdn.platform.smarter.sh/ui-chat/assets/main-BdQGq5eL.js"></script>
    <link class="smarter-chat" rel="stylesheet" crossorigin href="https://cdn.platform.smarter.sh/ui-chat/assets/main-BqQx6IPH.css">

 * --------------------------------------------------------------------------- */

// creates a new URL object from the current script's src attribute.
// example: https://cdn.platform.smarter.sh/ui-chat/index.html
export function deriveCdnUrl(filename) {
  const loaderUrl = document.currentScript.src;
  const url = new URL(loaderUrl);
  if (!url) {
    throw new Error("Could not derive the Smarter Chat app url from the current script's src attribute:", loaderUrl);
  }
  url.pathname = url.pathname.replace(/\/[^\/]*$/, "/" + filename);
  return url.toString();
}

// adds the class 'smarter-chat' to the element.
function addSmarterChatClass(element) {
  if (element && element.classList) {
    element.classList.add("smarter-chat");
  } else {
    console.warn("Could not add class 'smarter-chat' to the element:", element);
  }
  return element;
}

// inject the react app into the DOM
async function injectReactApp(url) {
  const url = deriveCdnUrl((filename = "index.html"));

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not fetch Smarter Chat app build artifacts: http response ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    if (!doc || !doc.documentElement) {
      throw new Error("Could not parse Smarter Chat app build artifacts:", text);
    }
    if (!doc.head || !doc.head.childNodes) {
      throw new Error("Could not find Smarter Chat app build artifacts in the DOM:", doc);
    }
    const elements = doc.head.childNodes; // all react build artifacts are placed in the <head> the DOM

    if (DEBUG_MODE === true) {
      console.log("received 200 response from the server:", url);
      console.log("html text:", text);
      console.log("html doc:", doc);
      console.log("DOM elements:", elements);
    }

    elements.forEach((element) => {
      if (element.nodeType === Node.ELEMENT_NODE) {
        // filter out superfluous elements that are part of
        // the react build.
        if (!element.classList.contains("internal")) {
          const elementClassed = addSmarterChatClass(element);
          // add links to the bottom of <head> of the DOM
          if (element.tagName === "LINK") {
            document.head.insertAdjacentElement("beforeend", elementClassed);
            if (DEBUG_MODE === true) {
              console.log("injected chat app element into the head.", elementClassed);
            }
          }
          // add scripts to the bottom of <body> of the DOM
          if (element.tagName === "SCRIPT") {
            // create a new script element and append it to the body
            // of the host website. This will execute the chat app js,
            // like a diffy duck, the chat app will render itself into
            // the DOM of the host website.
            const script = document.createElement("script");
            const scriptClassed = addSmarterChatClass(script);
            script.src = element.src;
            script.async = element.async;
            script.defer = element.defer;
            document.body.appendChild(scriptClassed);
            if (DEBUG_MODE === true) {
              console.log("injected and executed chat app script.", scriptClassed);
            }
          }
        }
      }
    });
  } catch (error) {
    console.error(
      "Error fetching and injecting chat app into the DOM. \
This error originates from the Smarter Chat component, \
Which is served from AWS Cloudfront, https://cdn.platform.smarter.sh/ui-chat/index.html \
Begin your trouble shooting journey by ensuring that this \
url permits public anonymous http GET requests. Additionally, \
this url is expected to return css and js link elements \
pointing to a valid react.js build. Source code for this \
react.js build is located at, \
https://github.com/smarter-sh/smarter-chat",
      error,
    );
  }
}
document.addEventListener("DOMContentLoaded", function () {
  injectReactApp();
});
