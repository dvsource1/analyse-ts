import { OptionValues } from 'commander'
import { filter, isEmpty, isNil, tail } from 'lodash'
import { getAllFilesInFolder } from './fs-helpers'

const exceptFile = (e: string) => (p: string) => !tail(p.split('/')).includes(e)

const filterFiles = (options: OptionValues) => {
  let files = []
  if (!isEmpty(options.files)) {
    files = options.files
  } else if (!isNil(options.path)) {
    files = getAllFilesInFolder(options.path)
  }

  if (!isNil(options.except)) {
    files = filter(files, exceptFile(options.except))
  }
  return files
}

export { filterFiles }
