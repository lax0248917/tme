const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const render = require("./render");

const forbiddenDirs = ["node_modules"];

class Runner {
  constructor() {
    this.testFiles = [];
  }

  async runTests() {
    for (let file of this.testFiles) {
      console.log(chalk.gray(`---- ${file.shortName}`));
      const beforeEaches = [];
      global.render = render;
      global.beforeEach = (fn) => {
        beforeEaches.push(fn);
      };
      global.it = async (desc, fn) => {
        beforeEaches.forEach((func) => func());
        try {
          await fn();
          console.log(chalk.green(`\tOK - ${desc}`));
        } catch (err) {
          const message = err.message.replace(/\n/g, "\n\t\t");
          console.log(chalk.red(`\tX - ${desc}`));
          console.log(chalk.red("\t", message));
        }
      };
      try {
        require(file.name);
      } catch (err) {
        console.log(chalk.red(err));
      }
    }
  }

  async collectFiles(targetPath) {
    const files = await fs.promises.readdir(targetPath);

    // Iterates over every file and grabs the file path for later
    for (let file of files) {
      const filepath = path.join(targetPath, file);
      const stats = await fs.promises.lstat(filepath);

      // looks over every file to make sure it has a .test.js extension
      if (stats.isFile() && file.includes(".test.js")) {
        this.testFiles.push({ name: filepath, shortName: file });
      } else if (stats.isDirectory() && !forbiddenDirs.includes(file)) {
        // if a directory we will assing the directory path and grab all
        // its children, then push those files into an array
        const childFiles = await fs.promises.readdir(filepath);

        // this will make sure we don't nest arrays and also builds the
        // full relative path to the directory location
        files.push(...childFiles.map((f) => path.join(file, f)));
      }
    }
  }
}

module.exports = Runner;
