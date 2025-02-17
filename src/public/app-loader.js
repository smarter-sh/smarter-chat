//   example url='https://cdn.platform.smarter.sh/ui-chat/app-loader.js'

import { deriveCdnUrl, DEBUG_MODE } from "../shared/constants";

/*
  This script is responsible for injecting the Smarter Chat app into the DOM
  of the host website. The chat app is served from AWS Cloudfront.

  /ui-chat/index.html contains the build artifacts of the Smarter Chat app.
  example:

    <script type="module" crossorigin src="https://cdn.platform.smarter.sh/ui-chat/assets/main-BdQGq5eL.js"></script>
    <link rel="stylesheet" crossorigin href="https://cdn.platform.smarter.sh/ui-chat/assets/main-BqQx6IPH.css">

  This script fetches /ui-chat/index.html, parses the html text, and injects
  the css and js link elements into the head/body of the host website.

*/
async function injectReactApp(url) {
  const url = deriveCdnUrl((filename = "index.html"));

  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
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
          // add links to the bottom of <head> of the DOM
          if (element.tagName === "LINK") {
            document.head.insertAdjacentElement("beforeend", element);
            if (DEBUG_MODE === true) {
              console.log("injected chat app element into the head.", element);
            }
          }
          // add scripts to the bottom of <body> of the DOM
          if (element.tagName === "SCRIPT") {
            // create a new script element and append it to the body
            // of the host website. This will execute the chat app js,
            // like a diffy duck, the chat app will render itself into
            // the DOM of the host website.
            const script = document.createElement("script");
            script.src = element.src;
            script.async = element.async;
            script.defer = element.defer;
            document.body.appendChild(script);
            if (DEBUG_MODE === true) {
              console.log("injected and executed chat app script.", script);
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
