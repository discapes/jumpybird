import { dialog } from "./util.js";

const __filename = import.meta.url.slice(import.meta.url.lastIndexOf("/") + 1);
const silentlog = (msg) => void console.log(`${__filename}: ${msg}`);
const log = (msg) => silentlog(msg) || dialog(msg, 1, 1);

function invokeSWUpdateFlow(registration) {
  if (registration.waiting) {
    registration.waiting.postMessage("SKIP_WAITING");
  }
  fetch("changelog.json")
    .then((res) => res.json())
    .then((changelog) => {
      let newsRead = localStorage.getItem("newsread") || 0;
      changelog.slice(newsRead, changelog.length).forEach(alert);
      localStorage.setItem("newsread", changelog.length);
    });
  alert("New version of the app is available.");
}

if ("serviceWorker" in navigator) {
  const reg = await navigator.serviceWorker.register("./sw.js", { scope: "/" });

  if (reg.waiting) {
    invokeServiceWorkerUpdateFlow(reg);
  }

  reg.addEventListener("updatefound", () => {
    if (reg.installing)
      reg.installing.addEventListener("statechange", () => {
        if (reg.waiting) {
          if (navigator.serviceWorker.controller) invokeSWUpdateFlow(reg);
          else silentlog("Installed sw for the first time.");
        }
      });
  });

  let refreshing = false;
  let firstSW = !navigator.serviceWorker.controller;

  // detect controller change and refresh the page
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing && !firstSW) {
      window.location.reload();
      refreshing = true;
    }
  });

  import("./game.js");
}
