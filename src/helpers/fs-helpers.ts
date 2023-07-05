import { createWriteStream, readdirSync, statSync, writeFileSync } from 'fs'
import { forEach, forOwn } from 'lodash'
import { extname, join } from 'path'

const getAllFilesInFolder = (
  folderPath: string,
  files: string[] = []
): string[] => {
  const entries = readdirSync(folderPath)

  for (const entry of entries) {
    const entryPath = join(folderPath, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      getAllFilesInFolder(entryPath, files)
    } else if (extname(entryPath) === '.ts') {
      files.push(entryPath)
    }
  }

  return files
}

const isFileExt = (fileName: string, ext: string): boolean => {
  const fileExtension = fileName.split('.').pop()
  return fileExtension === ext
}

const writeText = (obj: object, filePath: string) => {
  const stream = createWriteStream(filePath)

  const outputLines = []
  const print = (obj, prefix = '') => {
    forOwn(obj, (node, key) => {
      outputLines.push(`${prefix}${key}`)

      print(node, prefix + '--- ')
    })
  }

  print(obj)

  forEach(outputLines, (line) => {
    stream.write(line + '\n')
  })

  console.log(`Test file "${filePath}" has been created.`)
}

const writeJSON = (obj: object, filePath: string) => {
  const json = JSON.stringify(obj, null, 2)
  writeFileSync(filePath, json)
  console.log(`JSON file "${filePath}" has been created.`)
}

export { getAllFilesInFolder, isFileExt, writeJSON, writeText }
