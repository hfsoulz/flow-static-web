/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as ejs from 'ejs';
import { join } from 'path';
import * as fs from 'fs';
import { Helper } from './Helper.js';

/**
 * @brief Class handling screenshot generation.
 */
class Screenshot {
    /**
     * @brief Constructor.
     *
     * @param dirName is the full directory name.
     * @param outputDir is the output directory.
     * @param feeds is the feeds array.
     * @param screenshotsDir is the screenshots directory.
     * @param title is the title.
     * @param imageMin is the small image url.
     * @param imageBig is the big image url.
     * @param url is the url.
     */
    constructor(
        dirName,
        outputDir,
        feeds,
        screenshotsDir,
        title,
        imageMin,
        imageBig,
        url
    ) {
        this.dirName = dirName;
        this.outputDir = outputDir;
        this.feeds = feeds;
        this.screenshotsDir = screenshotsDir;

        this.title = title;
        this.imageMin = imageMin;
        this.imageBig = imageBig;
        this.url = url;
    }

    /**
     * @brief Create the output directory for this screenshot.
     */
    createOutputDir() {
        // create outputDir dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, `/${this.url}`));
    }

    /**
     * @brief Generate screenshot html at given output directory.
     *
     * @param screenshots is the array holding all screenshots.
     */
    async generate(screenshots) {
        const filePath = join(this.dirName, '/templates/screenshot.ejs');

        // data supplied to page render and default options:
        const data = {
            screenshotsDir: join(this.screenshotsDir, '/'),
            screenshot: this,
            screenshots: screenshots,
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
            join(this.outputDir, `/${this.url}/index.html`),
            indexHTML
        );
    }
}

export { Screenshot };
