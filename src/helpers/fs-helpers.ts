import * as fs from "fs";
import { forEach, forOwn } from "lodash";
import * as path from "path";

const getAllFilesInFolder = (
  folderPath: string,
  files: string[] = []
): string[] => {
  const entries = fs.readdirSync(folderPath);

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory()) {
      getAllFilesInFolder(entryPath, files);
    } else if (path.extname(entryPath) === ".ts") {
      files.push(entryPath);
    }
  }

  return files;
};

function writeText(obj: object, filePath: string) {
  const stream = fs.createWriteStream(filePath);

  const outputLines = [];
  const print = (obj, prefix = "") => {
    forOwn(obj, (node, key) => {
      outputLines.push(`${prefix}${key}`);

      print(node, prefix + "--- ");
    });
  };

  print(obj);

  forEach(outputLines, (line) => {
    stream.write(line + "\n");
  });

  console.log(`Test file "${filePath}" has been created.`);
}

function writeJSON(obj: object, filePath: string): void {
  const json = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, json);
  console.log(`JSON file "${filePath}" has been created.`);
}

export { getAllFilesInFolder, writeJSON, writeText };
