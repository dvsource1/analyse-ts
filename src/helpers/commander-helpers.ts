import { OptionValues } from 'commander'
import { filter, isNil, tail } from 'lodash'
import { getAllFilesInFolder } from './fs-helpers'

const exceptPath = (e: string) => (p: string) => !p.includes(e)
const exceptFile = (e: string) => (p: string) => !tail(p.split('/')).includes(e)

const filterFiles = (options: OptionValues) => {
  let files = []
  if (!isNil(options.files)) {
    files = options.files
  } else if (!isNil(options.path)) {
    files = getAllFilesInFolder(options.path)
  }

  if (!isNil(options.exceptPath)) {
    files = filter(files, exceptPath(options.exceptPath))
  }

  if (!isNil(options.except)) {
    files = filter(files, exceptFile(options.except))
  }
  return files
}

export { filterFiles }
