import React from "react";
import * as U from "url";
import * as P from "path";

const literalize = (urls:U.URL[]):string => urls.map(x=>x.toString()).map(x=>`"${x}"`).join(", ")
export const template = (libURL:U.URL, zrestURLs:U.URL[]) => (
  <div>
    <div id="target" style={{width: 512, height: 512}}></div>
    <script type='text/javascript' src={libURL.toString()}></script>
    <script dangerouslySetInnerHTML={{__html:`
closet.viewer.init({
  element: "target",
  width: 512,
  height: 512,
  stats: true,
});

function recurse(zrestURLs) {
  if (zrestURLs.length === 0) {
    fetch("http://screenshotrequest.clo", {
      method: "DELETE",
    });
  } else {
    closet.viewer.loadZrestUrl(
      zrestURLs[0],
      function (x) {},
      function (x) {
        (async function () {
          closet.viewer.recursiveObjectwiseViewFrustumCulling();
          await fetch("http://screenshotrequest.clo", {
            method: "POST",
            body: JSON.stringify({
              images: closet.viewer.capturePrincipleViews(),
            }),
          });
          recurse(zrestURLs.slice(1))
        })();
      }
    );
  }
}
recurse([${literalize(zrestURLs)}])
    `}}>
    </script>
  </div>
);
