/* luflow.net web site */
/* AGPL-3.0 License (see LICENSE) */

import * as fs from 'fs';

// characters [].:/ are reserved:
const UNSUPPORTED_CHARS_RE = '\\[\\]\\.:\\/';
const g_UnsupportedRegExp = new RegExp('[' + UNSUPPORTED_CHARS_RE + ']', 'g');

/**
 * @brief Helper class.
 */
class Helper {
    /**
     * @brief Constructor.
     */
    constructor() {}

    /**
     * @brief Replaces spaces with '-', removes unsupported characters and converts it to lower case.
     *
     * @param str is the string to be sanitized.
     */
    static sanitizeString(str) {
        const output = str.replace(/\s/g, '-').replace(g_UnsupportedRegExp, '');
        return output.toLowerCase();
    }

    /**
     * @brief Create directory recursively.
     *
     * @param dir is the directory to create.
     */
    static createDirRecursivelySync(dir) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created output dir: '${dir}'`);
    }

    /**
     * @brief Remove directory recursively.
     *
     * @param dir is the directory to remove.
     */
    static removeDirRecursivelySync(dir) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Removed output dir: '${dir}'`);
    }

    /**
     * @brief Write file (sync) to outputFilePath.
     *
     * @param outputFilePath is the output file path.
     * @param dataToWrite is the data to write.
     */
    static writeFileSync(outputFilePath, dataToWrite) {
        fs.writeFileSync(outputFilePath, dataToWrite);
        console.log(`Wrote '${outputFilePath}' successfully.`);
    }
}

export { Helper };
