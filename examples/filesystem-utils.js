const fs = require('fs').promises;
const path = require('path');

/**
 * Read a file's contents
 * @param filePath Path to the file to read
 * @param encoding Text encoding (default: utf8)
 */
async function readFile(filePath = './package.json', encoding = 'utf8') {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, encoding);
    return {
      path: absolutePath,
      size: content.length,
      encoding,
      content,
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Write content to a file
 * @param filePath Path where to write the file
 * @param content Content to write
 * @param encoding Text encoding (default: utf8)
 */
async function writeFile(filePath, content, encoding = 'utf8') {
  try {
    const absolutePath = path.resolve(filePath);
    await fs.writeFile(absolutePath, content, encoding);
    const stats = await fs.stat(absolutePath);
    return {
      path: absolutePath,
      size: stats.size,
      encoding,
      written: true,
    };
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

/**
 * List files and directories in a path
 * @param dirPath Directory path to list
 * @param includeHidden Include hidden files/directories
 */
async function listDirectory(dirPath = '.', includeHidden = false) {
  try {
    const absolutePath = path.resolve(dirPath);
    const items = await fs.readdir(absolutePath);

    const results = [];
    for (const item of items) {
      if (!includeHidden && item.startsWith('.')) {
        continue;
      }

      const itemPath = path.join(absolutePath, item);
      const stats = await fs.stat(itemPath);

      results.push({
        name: item,
        path: itemPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
      });
    }

    return {
      directory: absolutePath,
      itemCount: results.length,
      items: results,
    };
  } catch (error) {
    throw new Error(`Failed to list directory: ${error.message}`);
  }
}

/**
 * Get file or directory information
 * @param targetPath Path to the file or directory
 */
async function getFileInfo(targetPath) {
  try {
    const absolutePath = path.resolve(targetPath);
    const stats = await fs.stat(absolutePath);

    return {
      path: absolutePath,
      name: path.basename(absolutePath),
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      permissions: stats.mode.toString(8),
      isReadable: true, // We'll assume readable if stat succeeds
      isWritable: true, // We'll assume writable if stat succeeds
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

/**
 * Create a directory (with recursive option)
 * @param dirPath Path of directory to create
 * @param recursive Create parent directories if they don't exist
 */
async function createDirectory(dirPath, recursive = true) {
  try {
    const absolutePath = path.resolve(dirPath);
    await fs.mkdir(absolutePath, { recursive });
    const stats = await fs.stat(absolutePath);

    return {
      path: absolutePath,
      created: true,
      type: 'directory',
      modified: stats.mtime.toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
}

/**
 * Delete a file or directory
 * @param targetPath Path to delete
 * @param recursive For directories, delete recursively
 */
async function deleteFile(targetPath, recursive = false) {
  try {
    const absolutePath = path.resolve(targetPath);
    const stats = await fs.stat(absolutePath);

    if (stats.isDirectory()) {
      await fs.rmdir(absolutePath, { recursive });
    } else {
      await fs.unlink(absolutePath);
    }

    return {
      path: absolutePath,
      deleted: true,
      type: stats.isDirectory() ? 'directory' : 'file',
    };
  } catch (error) {
    throw new Error(`Failed to delete: ${error.message}`);
  }
}

/**
 * Copy a file to another location
 * @param sourcePath Source file path
 * @param destinationPath Destination file path
 */
async function copyFile(sourcePath, destinationPath) {
  try {
    const sourceAbsolute = path.resolve(sourcePath);
    const destAbsolute = path.resolve(destinationPath);

    await fs.copyFile(sourceAbsolute, destAbsolute);
    const sourceStats = await fs.stat(sourceAbsolute);
    const destStats = await fs.stat(destAbsolute);

    return {
      source: sourceAbsolute,
      destination: destAbsolute,
      copied: true,
      size: destStats.size,
      originalSize: sourceStats.size,
    };
  } catch (error) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

/**
 * Search for files by name pattern
 * @param searchPath Directory to search in
 * @param pattern File name pattern (supports wildcards)
 * @param recursive Search subdirectories
 */
async function searchFiles(searchPath = '.', pattern = '*', recursive = false) {
  try {
    const absolutePath = path.resolve(searchPath);
    const results = [];

    // eslint-disable-next-line no-inner-declarations
    async function searchDirectory(dirPath, depth = 0) {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isFile()) {
          // Simple pattern matching (convert * to regex)
          const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
          if (regex.test(item)) {
            results.push({
              name: item,
              path: itemPath,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              depth,
            });
          }
        } else if (stats.isDirectory() && recursive && depth < 10) {
          await searchDirectory(itemPath, depth + 1);
        }
      }
    }

    await searchDirectory(absolutePath);

    return {
      searchPath: absolutePath,
      pattern,
      recursive,
      matchCount: results.length,
      matches: results,
    };
  } catch (error) {
    throw new Error(`Failed to search files: ${error.message}`);
  }
}

/**
 * Read file content line by line (useful for large files)
 * @param filePath Path to the file
 * @param maxLines Maximum number of lines to read
 */
async function readFileLines(filePath, maxLines = 100) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    const lines = content.split('\n');

    const resultLines = lines.slice(0, maxLines);

    return {
      path: absolutePath,
      totalLines: lines.length,
      readLines: resultLines.length,
      truncated: lines.length > maxLines,
      lines: resultLines,
    };
  } catch (error) {
    throw new Error(`Failed to read file lines: ${error.message}`);
  }
}

/**
 * Get disk usage information for a path
 * @param targetPath Path to check disk usage for
 */
async function getDiskUsage(targetPath = '.') {
  try {
    const absolutePath = path.resolve(targetPath);
    const stats = await fs.stat(absolutePath);

    if (stats.isDirectory()) {
      let totalSize = 0;
      let fileCount = 0;
      let dirCount = 0;

      // eslint-disable-next-line no-inner-declarations
      async function calculateSize(dirPath) {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const itemStats = await fs.stat(itemPath);

          if (itemStats.isFile()) {
            totalSize += itemStats.size;
            fileCount++;
          } else if (itemStats.isDirectory()) {
            dirCount++;
            await calculateSize(itemPath);
          }
        }
      }

      await calculateSize(absolutePath);

      return {
        path: absolutePath,
        type: 'directory',
        totalSize,
        fileCount,
        directoryCount: dirCount,
        sizeFormatted: formatBytes(totalSize),
      };
    } else {
      return {
        path: absolutePath,
        type: 'file',
        totalSize: stats.size,
        fileCount: 1,
        directoryCount: 0,
        sizeFormatted: formatBytes(stats.size),
      };
    }
  } catch (error) {
    throw new Error(`Failed to get disk usage: ${error.message}`);
  }
}

/**
 * Helper function to format bytes into human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  readFile,
  writeFile,
  listDirectory,
  getFileInfo,
  createDirectory,
  deleteFile,
  copyFile,
  searchFiles,
  readFileLines,
  getDiskUsage,
};
