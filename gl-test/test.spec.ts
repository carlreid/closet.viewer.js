
import fs from "fs";
import URL from "url";
import PATH from "path"
import { hash } from "imghash";
import leven from "leven";
import puppeteer from "puppeteer";
import MetricReporter, { Measurement } from "../metric-reporter/metric-reporter";
import * as D from "io-ts/Decoder";
import { pipe } from "fp-ts/function";
import { bimap } from "fp-ts/Either";
// Consider using jest-puppeteer

declare var metricReporter:MetricReporter;

const casesPath = PATH.join(__dirname, 'cases')

const testCases = fs.readdirSync(casesPath).map(x => PATH.join(casesPath, x)).filter(x => fs.statSync(x).isDirectory())

var browser: puppeteer.Browser;
beforeAll(async () => {
    try {
        browser = await puppeteer.launch({args: ['--no-sandbox']});
    } catch (error) {
        console.log(error);
    }
})
afterAll(async () => {
    await browser.close();
})

const ChromeMetric = D.type({
    JSHeapUsedSize: D.number,
    JSHeapTotalSize: D.number,
    TaskDuration: D.number
})

describe.each(testCases)("graphic", (casePath:string) => {
    const htmlFilePath = PATH.join(casePath, 'scenario.html');
    const htmlExists = fs.existsSync(htmlFilePath);
    test(`${htmlFilePath} exists`, () => expect(htmlExists).toBeTruthy());

    const expectPath = PATH.join(casePath, 'expect.png');
    const expectExists = fs.existsSync(expectPath);
    test(`${expectPath} exists`, () => expect(expectExists).toBeTruthy())

    if (htmlExists && expectExists) {
        const testName = `${PATH.basename(casePath)} renders as expected`;
        test(testName, async () => {
            const page = await browser.newPage();
            const htmlFileURL = URL.pathToFileURL(htmlFilePath);
            await page.goto(htmlFileURL.toString());
            await page.waitForSelector("#finish");
            const element = await page.$("canvas");
            const pngBase64 = await element.screenshot();
            const sampleImgPath = PATH.join(casePath, "result.png");
            fs.writeFileSync(sampleImgPath, pngBase64, { encoding: 'base64' });
            const difference = await calculateDifference(sampleImgPath, expectPath);
            expect(difference).toBeLessThan(1);

            const metrics = await page.metrics();

            const decoded = ChromeMetric.decode(metrics);
            pipe(decoded, bimap(
                (notChromeMetric) => console.log("failed to decode ChromeMetric", metrics),
                (chromeMetric) => {
                    metricReporter.report({
                        [testName]: {
                            JSHeapUsedSize: new Measurement("bytes", chromeMetric.JSHeapUsedSize),
                            JSHeapTotalSize: new Measurement("bytes", chromeMetric.JSHeapTotalSize),
                            TaskDuration: new Measurement("s", chromeMetric.TaskDuration)
                        }
                    })
                }
            ))
            await page.close();
        }, 50000)
    }
})

async function calculateDifference(sampleImagePath: string, expectedImagePath: string) {
    const hash1 = await hash(sampleImagePath);
    const hash2 = await hash(expectedImagePath);

    const dist = leven(hash1, hash2);

    return dist;
}
