import React from "react";
import U from "url";
import P from "path";

export const template = (libURL: U.URL, modelURLs: U.URL[]) => (
  <div>
    <div
      id="target"
      style={{
        width: 512,
        height: 512,
      }}
    ></div>
    <script type="text/javascript" src={libURL.toString()}></script>
    <script
      dangerouslySetInnerHTML={{
        __html: `
    closet.viewer.init({
        element: 'target',
        width: 512,
        height: 512,
        stats: true
    });
      
      
      function recursion(urls) {
          if (urls.length == 0) {
              fetch("http://screenshotrequest.clo", {method: 'PUT',})
          } else {
              closet.viewer.loadZrestUrl(urls[0], function(x){}, function(x){
                  recursion(urls.slice(1))
    })
          }
      }
      
      recursion([
      ${modelURLs.map(x=>`"` + x.toString() + `"`).join(", ")}
      ])
    `,
      }}
    ></script>
  </div>
);
