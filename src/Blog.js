/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as ejs from 'ejs';
import { Feed } from 'feed';
import * as fs from 'fs';
import { join } from 'path';
import { BlogPost } from './BlogPost.js';
import { Helper } from './Helper.js';

/**
 * Class storing blog posts, lookup tables and generates overview pages.
 *
 * Generates overview pages for posts/topic/year etc.
 */
class Blog {
    /**
     * @brief Contructor.
     *
     * @param dirName is the full directory name.
     * @param outputDir is the output directory.
     * @param baseDir is the base directory.
     * @param numItemPreviewsPerPage is the number of preview items to show per page.
     */
    constructor(dirName, outputDir, baseDir, numItemPreviewsPerPage) {
        this.dirName = dirName;
        this.outputDir = join(outputDir, baseDir);
        this.baseDir = baseDir;
        this.numItemPreviewsPerPage = numItemPreviewsPerPage;
        this.feedsDir = join(outputDir, 'feeds');

        // array holding each parsed BlogPost:
        this.blogPosts = [];

        // topic => blogIndices array:
        this.topicBlogIndices = {};

        // year => blogIndices array:
        this.yearBlogIndices = {};

        this.feeds = [
            {
                url: '/feeds/blog.atom',
                name: 'Atom feed',
            },
        ];
    }

    /**
     * @brief Create output directories that we know of at this point.
     *
     * @note ('blog/topic', 'blog/year' etc).
     */
    createOutputDirs() {
        // create topic dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, '/topic'));

        // create year dir recursively:
        Helper.createDirRecursivelySync(join(this.outputDir, '/year'));

        // create feeds dir recursively:
        Helper.createDirRecursivelySync(this.feedsDir);
    }

    /**
     * @brief Parse all markdown files in given inputDir.
     *
     * @param inputDir is the input directory where markdown files are located.
     *
     * @return Promise resolve if success, otherwise reject with an error is returned.
     */
    async parseMarkdownFiles(inputDir) {
        return new Promise((resolve, reject) => {
            try {
                const files = fs.readdirSync(inputDir);

                files.forEach((file) => {
                    const blogPost = new BlogPost(
                        this.dirName,
                        this.outputDir,
                        this.baseDir
                    );
                    blogPost.parseMarkdownFile(
                        join(this.dirName, `/blog-posts/${file}`)
                    );

                    const blogID = this.blogPosts.length;

                    // add blogID for each blogs topic for later lookup:
                    blogPost.topics.forEach((topic) => {
                        let topicArr = this.topicBlogIndices[topic];
                        if (topicArr === undefined) {
                            let indices = [blogID];
                            this.topicBlogIndices[topic] = indices;
                        } else {
                            topicArr.push(blogID);
                        }
                    });

                    // add blogID for each blogs year for later lookup:
                    const year = blogPost.published.getFullYear();
                    let yearArr = this.yearBlogIndices[year];
                    if (yearArr === undefined) {
                        let indices = [blogID];
                        this.yearBlogIndices[year] = indices;
                    } else {
                        yearArr.push(blogID);
                    }

                    this.blogPosts.push(blogPost);
                });

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @brief Generate *all* blog posts.
     */
    async generateBlogPosts() {
        this.blogPosts.forEach((blogPost) => {
            blogPost.createOutputDir();
            blogPost.generate();
        });
    }

    /**
     * @brief Generate *all* blog overview pages.
     */
    async generateOverviewPosts() {
        const filePath = join(this.dirName, '/templates/blog_overview.ejs');
        let offset = 0;

        // figure out how many pages in total:
        const numPages = Math.ceil(
            this.blogPosts.length / this.numItemPreviewsPerPage
        );

        const numPosts = Math.min(
            this.numItemPreviewsPerPage,
            this.blogPosts.length
        );

        let topics = this.getSortedTopicsArray();
        let years = this.getSortedYearsArray();

        // write overview entry and all individual pages:
        for (let currentPage = 1; currentPage <= numPages; ++currentPage) {
            let blogPosts = this.blogPosts.slice(offset, offset + numPosts);

            // data supplied to page render and default options:
            const data = {
                blogPosts: blogPosts.reverse(),
                currentPage: currentPage,
                numPages: numPages,
                baseDir: join(this.baseDir, '/'),
                pageURL: join(this.baseDir, `/page/${currentPage}/`),
                feeds: this.feeds,
                topics: topics,
                years: years,
            };
            const options = {
                root: [this.dirName],
                filename: filePath,
                outputFunctionName: 'echo',
                async: false,
            };

            // render page:
            const overviewHTML = ejs.render(
                fs.readFileSync(filePath, 'utf8'),
                data,
                options
            );

            // write page to disk:
            if (currentPage == 1) {
                Helper.writeFileSync(
                    join(this.outputDir, '/index.html'),
                    overviewHTML
                );
            }

            // create page dir recursively:
            Helper.createDirRecursivelySync(
                join(this.outputDir, `/page/${currentPage}`)
            );

            // write page to disk:
            Helper.writeFileSync(
                join(this.outputDir, `/page/${currentPage}/index.html`),
                overviewHTML
            );

            offset += this.numItemPreviewsPerPage;
        }
    }

    /**
     * @brief Get sorted array with topic objects.
     */
    getSortedTopicsArray() {
        let topics = [];
        for (const [key, value] of Object.entries(this.topicBlogIndices)) {
            const topicStr = key.toString();
            const topicSanitized = Helper.sanitizeString(topicStr);

            const topic = {
                name: topicStr,
                url: join(this.baseDir, `/topic/${topicSanitized}/`),
                numBlogPosts: value.length,
            };

            topics.push(topic);
        }

        // sort by name:
        topics.sort((a, b) => {
            return this.sortByName(a, b);
        });

        return topics;
    }

    /**
     * @brief Get sorted array with year objects.
     */
    getSortedYearsArray() {
        let years = [];
        for (const [key, value] of Object.entries(this.yearBlogIndices)) {
            const yearStr = key.toString();

            const year = {
                name: yearStr,
                url: join(this.baseDir, `/year/${yearStr}/`),
                numBlogPosts: value.length,
            };

            years.push(year);
        }

        // sort by name:
        years.sort((a, b) => {
            return this.sortByName(a, b);
        });

        return years;
    }

    /**
     * @brief Sort method used to sort containers in alphabetical order.
     *
     * @param a is the first argument.
     * @param b is the second argument.
     */
    sortByName(a, b) {
        const nameA = a.name.toUpperCase(); // ignore upper and lowercase
        const nameB = b.name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal:
        return 0;
    }

    /**
     * @brief Generate *all* blog overview topic pages.
     */
    async generateOverviewTopic() {
        for (const [key, value] of Object.entries(this.topicBlogIndices)) {
            const filePath = join(
                this.dirName,
                '/templates/blog_overview_topic.ejs'
            );
            let offset = 0;
            const topic = key.toString();
            const topicSanitized = Helper.sanitizeString(topic);

            let blogPosts = [];
            value.forEach((blogID) => {
                blogPosts.push(this.blogPosts[blogID]);
            });
            blogPosts.reverse();

            // figure out how many pages in total:
            const numPages = Math.ceil(
                blogPosts.length / this.numItemPreviewsPerPage
            );

            const numPosts = Math.min(
                this.numItemPreviewsPerPage,
                blogPosts.length
            );

            let topics = this.getSortedTopicsArray();
            let years = this.getSortedYearsArray();

            // write overview entry and all individual pages:
            for (let currentPage = 1; currentPage <= numPages; ++currentPage) {
                let blogPostsData = blogPosts.slice(offset, offset + numPosts);

                // data supplied to page render and default options:
                const data = {
                    topic: topic,
                    topicSanitized: topicSanitized,
                    blogPosts: blogPostsData,
                    currentPage: currentPage,
                    numPages: numPages,
                    baseDir: join(this.baseDir, '/'),
                    pageURL: join(
                        this.baseDir,
                        `/topic/${topicSanitized}/page/${currentPage}/`
                    ),
                    feeds: this.feeds,
                    topics: topics,
                    years: years,
                };
                const options = {
                    root: [this.dirName],
                    filename: filePath,
                    outputFunctionName: 'echo',
                    async: false,
                };

                // render page:
                const overviewHTML = ejs.render(
                    fs.readFileSync(filePath, 'utf8'),
                    data,
                    options
                );

                // create page dir recursively:
                Helper.createDirRecursivelySync(
                    join(
                        this.outputDir,
                        `/topic/${topicSanitized}/page/${currentPage}`
                    )
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(
                        this.outputDir,
                        `/topic/${topicSanitized}/page/${currentPage}/index.html`
                    ),
                    overviewHTML
                );

                // create topic dir recursively:
                if (currentPage == 1) {
                    Helper.createDirRecursivelySync(
                        join(this.outputDir, `/topic/${topicSanitized}`)
                    );

                    // write page to disk:
                    Helper.writeFileSync(
                        join(
                            this.outputDir,
                            `/topic/${topicSanitized}/index.html`
                        ),
                        overviewHTML
                    );
                }

                offset += this.numItemPreviewsPerPage;
            }
        }
    }

    /**
     * @brief Generate *all* blog overview year pages.
     */
    async generateOverviewYear() {
        for (const [key, value] of Object.entries(this.yearBlogIndices)) {
            const filePath = join(
                this.dirName,
                '/templates/blog_overview_year.ejs'
            );
            let offset = 0;
            const year = key.toString();

            let blogPosts = [];
            value.forEach((blogID) => {
                blogPosts.push(this.blogPosts[blogID]);
            });
            blogPosts.reverse();

            // figure out how many pages in total:
            const numPages = Math.ceil(
                blogPosts.length / this.numItemPreviewsPerPage
            );

            const numPosts = Math.min(
                this.numItemPreviewsPerPage,
                blogPosts.length
            );

            let topics = this.getSortedTopicsArray();
            let years = this.getSortedYearsArray();

            // write overview entry and all individual pages:
            for (let currentPage = 1; currentPage <= numPages; ++currentPage) {
                let blogPostsData = blogPosts.slice(offset, offset + numPosts);

                // data supplied to page render and default options:
                const data = {
                    year: year,
                    blogPosts: blogPostsData,
                    currentPage: currentPage,
                    numPages: numPages,
                    baseDir: join(this.baseDir, '/'),
                    pageURL: join(
                        this.baseDir,
                        `/year/${year}/page/${currentPage}/`
                    ),
                    feeds: this.feeds,
                    topics: topics,
                    years: years,
                };
                const options = {
                    root: [this.dirName],
                    filename: filePath,
                    outputFunctionName: 'echo',
                    async: false,
                };

                // render page:
                const overviewHTML = ejs.render(
                    fs.readFileSync(filePath, 'utf8'),
                    data,
                    options
                );

                // create page dir recursively:
                Helper.createDirRecursivelySync(
                    join(this.outputDir, `/year/${year}/page/${currentPage}`)
                );

                // write page to disk:
                Helper.writeFileSync(
                    join(
                        this.outputDir,
                        `/year/${year}/page/${currentPage}/index.html`
                    ),
                    overviewHTML
                );

                // create topic dir recursively:
                if (currentPage == 1) {
                    Helper.createDirRecursivelySync(
                        join(this.outputDir, `/year/${year}`)
                    );

                    // write page to disk:
                    Helper.writeFileSync(
                        join(this.outputDir, `/year/${year}/index.html`),
                        overviewHTML
                    );
                }

                offset += this.numItemPreviewsPerPage;
            }
        }
    }

    /**
     * @brief Generate the Atom blog feeed.
     */
    async generateBlogFeed() {
        const websiteURL = 'https://www.luflow.net/';

        const feed = new Feed({
            title: 'luflow.net Blog',
            description:
                'This blog is dedicated to free software in general with a special focus on graphics engines.',
            id: join(websiteURL, this.feeds[0].url),
            generator: 'Universe',
            link: join(websiteURL, `${this.baseDir}/`),
            language: 'en',
            image: join(websiteURL, 'static/img/icon.png'),
            favicon: join(websiteURL, 'favicon.ico'),
            feedLinks: {
                atom: join(websiteURL, 'feeds/blog.atom'),
            },
            author: {
                name: 'luflow.net',
                link: websiteURL,
            },
        });

        let blogPosts = this.blogPosts.slice(0, this.blogPosts.length);
        blogPosts.reverse();

        blogPosts.forEach((post) => {
            let categories = [];
            post.topics.forEach((topic) => {
                categories.push({
                    term: topic,
                });
            });

            feed.addItem({
                title: post.title,
                id: join(websiteURL, `blog/${post.url}/`),
                link: join(websiteURL, `blog/${post.url}/`),
                description: post.snippet,
                content: post.html,
                author: [
                    {
                        name: post.author,
                    },
                ],
                category: categories,
                date: post.updated,
                published: post.published,
            });
        });

        // write blog.atom:
        Helper.writeFileSync(join(this.feedsDir, 'blog.atom'), feed.atom1());
    }
}

export { Blog };
