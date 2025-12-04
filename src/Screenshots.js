/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as ejs from 'ejs';
import { join } from 'path';
import * as fs from 'fs';
import { Screenshot } from './Screenshot.js';
import { Helper } from './Helper.js';

/**
 * @brief Class storing screenshots, lookup tabless related to it etc.
 *
 * Parses input files and generates individual screenshot pages from that info.
 */
class Screenshots {
    constructor(dirName, outputDir, feeds) {
        this.dirName = dirName;
        this.outputDir = outputDir;
        this.feeds = feeds;

        this.screenshots = {};
        this.screenshotsDir = {};
    }

    /**
     * @brief Create output directory.
     *
     * @param outputDir is the output directory to create.
     */
    createOutputDir(outputDir) {
        // create outputDir dir recursively:
        Helper.createDirRecursivelySync(outputDir);
    }

    /**
     * @brief Parse all input files in given inputDir.
     *
     * @param inputDir is the input directory where files are located.
     */
    async parseFiles(inputDir) {
        return new Promise((resolve, reject) => {
            try {
                const files = fs.readdirSync(inputDir);

                // screenshots:
                let screenshots = {
                    title: null,
                    url: null,
                };

                // screenshot:
                let title = null;
                let imageMin = null;
                let imageBig = null;
                let url = null;

                files.forEach((file) => {
                    const filePath = join(inputDir, `/${file}`);
                    fs.readFileSync(filePath, 'utf-8')
                        .split(/\r?\n/)
                        .forEach((line) => {
                            const firstColon = line.indexOf(':');

                            if (line.substring(0, 16) === 'screenshotsTitle') {
                                screenshots.title = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            } else if (
                                line.substring(0, 14) === 'screenshotsURL'
                            ) {
                                screenshots.url = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            } else if (line.substring(0, 5) === 'title') {
                                title = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            } else if (line.substring(0, 8) === 'imageMin') {
                                imageMin = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            } else if (line.substring(0, 8) === 'imageBig') {
                                imageBig = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            } else if (line.substring(0, 3) === 'url') {
                                url = line
                                    .substring(firstColon + 1, line.length)
                                    .trim();
                            }

                            // cache current screenshot:
                            if (title && imageMin && imageBig && url) {
                                let screenshot = new Screenshot(
                                    this.dirName,
                                    this.outputDir,
                                    this.feeds,
                                    screenshots.url,
                                    title,
                                    imageMin,
                                    imageBig,
                                    url
                                );

                                // cache screenshot by screenshotsTitle:
                                let screenshotArr =
                                    this.screenshots[screenshots.title];
                                if (screenshotArr === undefined) {
                                    let arr = [screenshot];
                                    this.screenshots[screenshots.title] = arr;
                                    this.screenshotsDir[screenshots.title] =
                                        screenshots.url;
                                } else {
                                    screenshotArr.push(screenshot);
                                }

                                title = null;
                                imageMin = null;
                                imageBig = null;
                                url = null;
                            }
                        });
                });

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @brief Generate *all* individual screenshots.
     */
    async generate() {
        for (const [key, value] of Object.entries(this.screenshots)) {
            const screenshotsDir = this.screenshotsDir[key.toString()];
            this.createOutputDir(join(this.outputDir, `/${screenshotsDir}`));

            const filePath = join(this.dirName, '/templates/screenshots.ejs');

            // data supplied to page render and default options:
            const data = {
                screenshotsTitle: key.toString(),
                screenshots: value,
                feeds: this.feeds,
            };
            const options = {
                root: [this.dirName],
                filename: filePath,
                outputFunctionName: 'echo',
                async: false,
            };

            // render page:
            const indexHTML = ejs.render(
                fs.readFileSync(filePath, 'utf8'),
                data,
                options
            );

            // write page to disk:
            Helper.writeFileSync(
                join(this.outputDir, `/${screenshotsDir}/index.html`),
                indexHTML
            );

            value.forEach((screenshot) => {
                screenshot.createOutputDir();
                screenshot.generate(value);
            });
        }
    }
}

export { Screenshots };
