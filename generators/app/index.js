"use strict";
/* eslint-disable no-await-in-loop */
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const fs = require("fs");

module.exports = class extends Generator {
  async prompting() {
    this.config.defaults({ folder: [] });

    const prompts = [
      {
        type: "input",
        name: "name",
        message: `What's the name of the component you want to create?`,
        validate: value =>
          getWords(value).length >= 2
            ? true
            : "Your component must have at least 2 words"
      }
    ];

    this.currentPath = this.config.get("folder");

    let props = await this.prompt(prompts);
    this.props = props;

    while (props.path !== "Select this folder") {
      props = await this.prompt([
        {
          type: "list",
          name: "path",
          message: `Current folder: ${this.currentPath.join("/")}`,
          choices: [
            "Select this folder",
            ...fs
              .readdirSync(this.destinationPath(...this.currentPath))
              .filter(
                x => !fs.statSync([...this.currentPath, x].join("/")).isFile()
              ),
            "Go Back"
          ]
        }
      ]);

      if (props.path === "Go Back") {
        this.currentPath.splice(-1);
      } else if (props.path !== "Select this folder") {
        this.currentPath.push(props.path);
      }
    }

    if (this.currentPath.join("") !== this.config.get("folder").join("")) {
      props = await this.prompt([
        {
          type: "confirm",
          name: "saveFolder",
          message: `Do you want to save this folder for future generations?: ${this.currentPath.join(
            "/"
          )}`
        }
      ]);

      this.props.saveFolder = props.saveFolder;
    }

    const indexFileExists = fs
      .readdirSync(this.destinationPath(...this.currentPath))
      .find(x => x === "index.js");

    this.props.importComponentInIndex = false;
    if (indexFileExists) {
      const { importComponentInIndex } = await this.prompt([
        {
          type: "confirm",
          name: "importComponentInIndex",
          message: `An index file was found in the destination folder, do you want to import your component there?`
        }
      ]);

      this.props.importComponentInIndex = importComponentInIndex;
    }
  }

  writing() {
    this.log(getWords(this.props.name));
    this.log(`Final path: ./${this.currentPath.join("/")}`);

    if (this.props.saveFolder) {
      this.config.set({ folder: this.currentPath });
      this.config.save();
    }

    const componentNames = generateComponentNames(this.props.name);

    this.log("Creating files");
    this.fs.copyTpl(
      this.templatePath("componentTemplate.js"),
      this.destinationPath(
        ...this.currentPath,
        componentNames.camelCase,
        `${componentNames.camelCase}.js`
      ),
      componentNames
    );

    this.log("Importing component to index file");
    if (this.props.importComponentInIndex) {
      const indexFilePath = this.destinationPath(
        ...this.currentPath,
        "index.js"
      );
      const file = this.fs.read(indexFilePath, "index.js");

      const finalFile = `import './${componentNames.camelCase}/${componentNames.camelCase}';\n${file}`;
      this.fs.write(indexFilePath, finalFile);
    }
  }
};

function getWords(sentence) {
  return sentence.split(" ").filter(x => x !== "");
}

function generateComponentNames(name) {
  const words = getWords(name).map(x => x.toLowerCase());
  const [firstWord, ...rest] = words;

  return {
    name,
    camelCase: firstWord + rest.map(capitalizeFirstLetter).join(""),
    componentName: words.join("-")
  };
}

function capitalizeFirstLetter(word) {
  return word.substring(0, 1).toUpperCase() + word.substring(1);
}
