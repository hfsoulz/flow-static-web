/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as ejs from 'ejs';
import * as fs from 'fs';
import { join } from 'path';
import Showdown from 'showdown';
import { Helper } from './Helper.js';

/**
 * @brief Class handling blog post specific generation and storage.
 */
class BlogPost {
    /**
     * @brief Constructor.
     *
     * @param dirName is the full directory name.
     * @param outputDir is the output directory.
     * @param baseDir is the base directory.
     */
    constructor(dirName, outputDir, baseDir) {
        this.dirName = dirName;
        this.outputDir = outputDir;
        this.baseDir = baseDir;

        this.author = null;
        this.published = null;
        this.updated = null;
        this.topics = [];
        this.title = null;
        this.snippet = null;

        this.topicsSanitized = [];
        this.topicsCommaSep = null;
        this.topicBaseDir = 'topic';
        this.html = null;
        this.url = null;
    }

    /**
     * @brief Create the output directory for this blog post.
     */
    createOutputDir() {
        // create blog post dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, this.url));
    }

    /**
     * @brief Parse given markdown file and store data for later generation.
     *
     * @param filePath is the path to the markdown file to parse.
     */
    parseMarkdownFile(filePath) {
        let markdown = '';
        let postStartFound = false;

        fs.readFileSync(filePath, 'utf-8')
            .split(/\r?\n/)
            .forEach((line) => {
                if (!postStartFound) {
                    if (line.substring(0, 6) === 'author') {
                        const firstColon = line.indexOf(':');
                        this.author = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                    } else if (line.substring(0, 9) === 'published') {
                        const firstColon = line.indexOf(':');
                        const dateStr = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                        this.published = new Date(dateStr);
                    } else if (line.substring(0, 7) === 'updated') {
                        const firstColon = line.indexOf(':');
                        const dateStr = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                        this.updated = new Date(dateStr);
                    } else if (line.substring(0, 6) === 'topics') {
                        const firstColon = line.indexOf(':');
                        this.topicsCommaSep = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                        const tmp = this.topicsCommaSep.split(',');
                        tmp.forEach((topic) => {
                            const topicTrimmed = topic.trim();
                            this.topics.push(topicTrimmed);
                            this.topicsSanitized.push(
                                Helper.sanitizeString(topicTrimmed)
                            );
                        });
                    } else if (line.substring(0, 5) === 'title') {
                        const firstColon = line.indexOf(':');
                        this.title = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                        this.url = Helper.sanitizeString(this.title);
                    } else if (line.substring(0, 7) === 'snippet') {
                        const firstColon = line.indexOf(':');
                        this.snippet = line
                            .substring(firstColon + 1, line.length)
                            .trim();
                    } else if (line === '---') {
                        postStartFound = true;
                    }
                } else {
                    markdown += '\n';
                    markdown += line;
                }
            });

        // convert markdown to HTML:
        const converter = new Showdown.Converter();
        this.html = converter.makeHtml(markdown);
    }

    /**
     * @brief Generate blog post html at given output directory.
     */
    async generate() {
        const filePath = join(this.dirName, '/templates/blog_post.ejs');

        // data supplied to page render and default options:
        const data = {
            baseDir: join(this.baseDir, '/'),
            url: join(this.baseDir, `${this.url}/`),
            title: this.title,
            snippet: this.snippet,
            topicsCommaSep: this.topicsCommaSep,
            topics: this.topics,
            topicsSanitized: this.topicsSanitized,
            topicBaseDir: this.topicBaseDir,
            html: this.html,
            author: this.author,
            date: this.published.toDateString(),
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
            join(this.outputDir, `${this.url}/index.html`),
            indexHTML
        );
    }
}

export { BlogPost };
