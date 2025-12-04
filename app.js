/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import { Core } from './src/Core.js';
import { Blog } from './src/Blog.js';
import { Screenshots } from './src/Screenshots.js';
import { Helper } from './src/Helper.js';
import path from 'path';

// output dirs to use:
const dirName = path.resolve();
const outputDir = path.join(dirName, 'output');
const numItemPreviewsPerPage = 30;

// generate core pages like index, contact, hfge:
const core = new Core(dirName, outputDir);

// create *all* output dirs related to core:
core.createOutputDirs();

// copy all static files to output folder:
const src = path.join(dirName, '/static');
const dst = path.join(outputDir, '/static');
core.copyStaticFiles(src, dst)
    .then(() => {
        console.log(
            `Copied *all* files/dirs from '${src}' to '${dst}' successfully.`
        );
    })
    .catch((error) => {
        console.log(error);
    });
const src_root = path.join(dirName, '/static_root');
const dst_root = path.join(outputDir, '/');
core.copyStaticFiles(src_root, dst_root)
    .then(() => {
        console.log(
            `Copied *all* files/dirs from '${src_root}' to '${dst_root}' successfully.`
        );
    })
    .catch((error) => {
        console.log(error);
    });

// generate all core HTML files (except root index as it needs blogPosts too) and write to output folder:
core.generate()
    .then(() => {
        console.log('Core generation done.');
    })
    .catch((error) => {
        console.log(error);
    });

// generate all blog related pages from input markdown files:
const blog = new Blog(dirName, outputDir, '/blog', numItemPreviewsPerPage);

// create *all* output dirs related to blog:
blog.createOutputDirs();

// parse all markdown files:
blog.parseMarkdownFiles(path.join(dirName, 'blog-posts'))
    .then(() => {
        console.log('Blog: Parsing markdown done.');

        blog.generateBlogPosts();
        blog.generateOverviewPosts();
        blog.generateOverviewTopic();
        blog.generateOverviewYear();
        blog.generateBlogFeed();
    })
    .catch((error) => {
        console.log(error);
    });

// generate screenshots related pages:
const screenshots = new Screenshots(dirName, outputDir, blog.feeds);

// parse all input files:
screenshots
    .parseFiles(path.join(dirName, 'screenshots'))
    .then(() => {
        console.log('Blog: Parsing screenshots done.');

        screenshots.generate(blog);
    })
    .catch((error) => {
        console.log(error);
    });

// generate main entry point index.html now that we've all info needed:
for (const [key, value] of Object.entries(screenshots.screenshots)) {
    const keySanitized = Helper.sanitizeString(key.toString());

    // check for hfge screenshots so those are included in generation:
    if (keySanitized === 'hfge-screenshots') {
        core.generateRootIndex(outputDir, blog, value);
    }
}
