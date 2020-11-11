import * as fs from "fs";
import * as D from "io-ts/Decoder";
import MetricReporter, { Measurement } from "../MetricReporter";
import * as webpackConfig from "../../webpack.config";
import P from "path";
import { streamPageEvents } from "../common";
import * as U from "url";
import { concatMap, map, mergeMap, toArray, tap } from "rxjs/operators";
import ReactDomServer from "react-dom/server";
import { template } from "./template";
import * as E from "fp-ts/Either";
import { zrestURLs } from "./zrestURLs";
import { from } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { resolve } from "../../webpack.config";
import got from "got";

declare var metricReporter: MetricReporter;

const ChromeMetric = D.type({
  JSHeapUsedSize: D.number,
  JSHeapTotalSize: D.number,
  TaskDuration: D.number,
});

test("Bundle size test", () => {
  const filename = webpackConfig.output.filename;
  const dist = webpackConfig.output["path"] ?? "./dist";
  const bundleFileStat = fs.statSync(P.resolve(dist, filename));
  expect(bundleFileStat.size).toBeLessThan(2.5 * 1024 * 1024);
  metricReporter.report({
    "Bundle size test": {
      "Bundle Size": new Measurement("bytes", bundleFileStat.size),
    },
  });
});

const zrestsDir = P.resolve(__dirname, "zrests")

beforeAll(()=>{
  console.log(zrestsDir);
  fs.mkdirSync(zrestsDir);
  fs.chmodSync(zrestsDir, 0o777);
})

const benchmarkName = "zrest loading benchmarking"
test(benchmarkName, (done) => {

  const libPath = P.resolve(__dirname, "..", "..", "dist", "closet.viewer.js");

  from(zrestURLs).pipe(
    concatMap(download(zrestsDir)),
    map(U.pathToFileURL),
    toArray(),
    map(zrestLocalURLs => template(U.pathToFileURL(libPath), zrestLocalURLs)),
    map(ReactDomServer.renderToStaticMarkup),
    mergeMap(html =>  streamPageEvents(html, (page) => page.metrics())),
    map(ChromeMetric.decode),
    map(E.fold(
      (notChromeMetric) => { throw notChromeMetric },
      (decoded) => ({
        [benchmarkName]: {
          JSHeapUsedSize: new Measurement("bytes", decoded.JSHeapUsedSize),
          JSHeapTotalSize: new Measurement("bytes", decoded.JSHeapTotalSize),
          TaskDuration: new Measurement("s", decoded.TaskDuration),
        }
      })
    )),
  ).subscribe({
    next: (metric) => metricReporter.report(metric),
    complete: done
  })
}, 5 * 60 * 1000);


const download = (downloadDir:string) => (url:U.URL):Promise<string> => {
  const dst = P.resolve(downloadDir, uuidv4() + ".zrest")
  const downloadStream = got.stream(url.toString())
  const writeStream = fs.createWriteStream(dst)

  return new Promise((resolve, reject) => {
    writeStream.on("finish", ()=>resolve(dst))
    writeStream.on("error", reject)
    downloadStream.on("error", reject)
    downloadStream.pipe(writeStream)
  })
}