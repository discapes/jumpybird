/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5a491d68'], (function (workbox) { 'use strict';

  /**
  * Welcome to your Workbox-powered service worker!
  *
  * You'll need to register this file in your web app.
  * See https://goo.gl/nhQhGp
  *
  * The rest of the code is auto-generated. Please don't update this file
  * directly; instead, make changes to your Workbox build configuration
  * and re-run your build process.
  * See https://goo.gl/2aRDsh
  */

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */


  workbox.registerRoute(({
    url
  }) => true, new workbox.CacheFirst({
    plugins: [new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  // console.log("registered");;;;
  //postMessage(listenersadded);;

  workbox.precacheAndRoute([{
    "url": "assets/bg.png",
    "revision": "db5e73210dfcdd31ac711c35da31005d"
  }, {
    "url": "build/bundle.js",
    "revision": "10d68559585191c8980bf3a7369de444"
  }, {
    "url": "build/styles.min.css",
    "revision": "bb007ab5db1a3f44583d34ade31dcf07"
  }, {
    "url": "favicon.ico",
    "revision": "09a1e8e01ec02ef4dcde7d2441f1086d"
  }, {
    "url": "icons/icon-1024x1024.png",
    "revision": "42ef93b8a53851651e5545905a6f3232"
  }, {
    "url": "icons/icon-128x128.png",
    "revision": "d681b4297a88e64af70c0eb0d061a444"
  }, {
    "url": "icons/icon-144x144.png",
    "revision": "514d8025e713dee11b64847dfa8b5fee"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "841cb8ef6a2c7163aa2c0fc64faccea4"
  }, {
    "url": "icons/icon-384x384.png",
    "revision": "823e9a2c8c956037d0f3ab8d7701c771"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "7ddaec85559539e678873742676103f7"
  }, {
    "url": "icons/icon-72x72.png",
    "revision": "f4ce6c0b90ec3482dc6b9d7bf555b399"
  }, {
    "url": "icons/icon-96x96.png",
    "revision": "5b6c66b7dc69c7fbf5fed451c5c0257a"
  }, {
    "url": "icons/maskable_icon_x128.png",
    "revision": "68e2fb5c36a3d7600d7b4afdd2331654"
  }, {
    "url": "icons/maskable_icon_x192.png",
    "revision": "c328365a9af31a61df9c1a93d0980e36"
  }, {
    "url": "icons/maskable_icon_x384.png",
    "revision": "8906a3d5cccb41da2772b07ddb2de8e5"
  }, {
    "url": "icons/maskable_icon_x512.png",
    "revision": "2c12ba592882fc04784df3410d516821"
  }, {
    "url": "icons/maskable_icon_x72.png",
    "revision": "466da4ece0979ab36113b0e39e847262"
  }, {
    "url": "icons/maskable_icon_x96.png",
    "revision": "9a7ea1b04bf78fe54ef77b8b8bb5d511"
  }, {
    "url": "index.html",
    "revision": "928e9e0d802d7e2aed57e6b77669a79c"
  }, {
    "url": "manifest.json",
    "revision": "77d639885f73fd0c060f4a121b37c5b0"
  }, {
    "url": "screenshots/3j9bal1.jpg",
    "revision": "b74a053f2db2576c6e193a15cd4654f1"
  }, {
    "url": "screenshots/fvWeclw.jpg",
    "revision": "141bf56fc0671b0879a7cef45ff40ad5"
  }, {
    "url": "screenshots/tmBM3C2.jpg",
    "revision": "7b95e41f7da99c7a96740808a8bc339f"
  }], {
    "ignoreURLParametersMatching": []
  });
}));
