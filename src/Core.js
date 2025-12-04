/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as ejs from 'ejs';
import * as fs from 'fs';
import { join } from 'path';
import { Helper } from './Helper.js';

/**
 * @brief Class handling generation of core pages like contact and hfge.
 */
class Core {
    constructor(dirName, outputDir) {
        this.dirName = dirName;
        this.outputDir = outputDir;

        this.indexPath = join(this.dirName, '/templates/index.ejs');
        this.hfgePath = join(this.dirName, '/templates/hfge.ejs');
        this.contactPath = join(this.dirName, '/templates/contact.ejs');
        this.missingPath = join(this.dirName, '/templates/404.ejs');
        this.errorPath = join(this.dirName, '/templates/500.ejs');
    }

    /**
     * @brief Create output directories needed (also removes old directory if exists).
     */
    createOutputDirs() {
        if (fs.existsSync(this.outputDir)) {
            // remove old dir recursively first:
            Helper.removeDirRecursivelySync(this.outputDir);
        }

        // create contact dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, '/contact'));

        // create projects/hfge dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, '/projects/hfge'));
    }

    /**
     * @brief Generate *all* core pages.
     */
    async generate() {
        return new Promise((resolve, reject) => {
            try {
                // default options:
                const data = {};
                const options = {
                    root: [this.dirName],
                    filename: this.contactPath,
                    outputFunctionName: 'echo',
                    async: false,
                };

                // render contect page:
                options.filename = this.contactPath;
                const contactHTML = ejs.render(
                    fs.readFileSync(this.contactPath, 'utf8'),
                    data,
                    options
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(this.outputDir, '/contact/index.html'),
                    contactHTML
                );

                // render hfge page:
                options.filename = this.hfgePath;
                const hfgeHTML = ejs.render(
                    fs.readFileSync(this.hfgePath, 'utf8'),
                    data,
                    options
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(this.outputDir, '/projects/hfge/index.html'),
                    hfgeHTML
                );

                // render 404 page:
                options.filename = this.missingPath;
                const missingHTML = ejs.render(
                    fs.readFileSync(this.missingPath, 'utf8'),
                    data,
                    options
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(this.outputDir, '/404.html'),
                    missingHTML
                );

                // render 500 page:
                options.filename = this.errorPath;
                const errorHTML = ejs.render(
                    fs.readFileSync(this.errorPath, 'utf8'),
                    data,
                    options
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(this.outputDir, '/500.html'),
                    errorHTML
                );

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @brief Generate root index.html.
     *
     * @param outputDir is the output directory.
     * @param blog is the blog holding blog posts needed for generation.
     * @param screenshots is the screenshots needed for generation.
     */
    async generateRootIndex(outputDir, blog, screenshots) {
        const numPosts = Math.min(blog.blogPosts.length, 3);
        const offset = blog.blogPosts.length - numPosts;
        const blogPosts = blog.blogPosts.slice(offset, offset + numPosts);

        const numScreenshots = Math.min(screenshots.length, 6);
        const screenshotsSlice = screenshots.slice(0, numScreenshots);

        // data supplied to page render and default options:
        const data = {
            blogPosts: blogPosts.reverse(),
            screenshots: screenshotsSlice,
            blogOutputDir: join(blog.baseDir, '/'),
            hfgeURL: '/projects/hfge/',
        };
        const options = {
            root: [this.dirName],
            filename: this.indexPath,
            outputFunctionName: 'echo',
            async: false,
        };

        // render index page:
        options.filename = this.indexPath;
        const indexHTML = ejs.render(
            fs.readFileSync(this.indexPath, 'utf8'),
            data,
            options
        );

        // write page to disk:
        Helper.writeFileSync(join(outputDir, '/index.html'), indexHTML);
    }

    /**
     * @brief Copies *all* static files from src to dst.
     *
     * @param src is the source directory to copy from.
     * @param dst is the destination directory to copy to.
     *
     * @return Promise resolve if success, otherwise reject with an error is returned.
     */
    async copyStaticFiles(src, dst) {
        return new Promise((resolve, reject) => {
            try {
                fs.cpSync(src, dst, { recursive: true });
                console.log(
                    `Copied *all* files/dirs from '${src} to '${dst} successfully.`
                );

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

export { Core };
