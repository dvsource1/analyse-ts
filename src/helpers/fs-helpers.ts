import * as fs from 'fs'
import * as path from 'path'

const getAllFilesInFolder = (
  folderPath: string,
  files: string[] = []
): string[] => {
  const entries = fs.readdirSync(folderPath)

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry)
    const stat = fs.statSync(entryPath)

    if (stat.isDirectory()) {
      getAllFilesInFolder(entryPath, files)
    } else if (path.extname(entryPath) === '.ts') {
      files.push(entryPath)
    }
  }

  return files
}

function writeJSON(obj: object, filePath: string): void {
  const json = JSON.stringify(obj, null, 2)
  fs.writeFileSync(filePath, json)
  console.log(`JSON file "${filePath}" has been created.`)
}

export { getAllFilesInFolder, writeJSON }
