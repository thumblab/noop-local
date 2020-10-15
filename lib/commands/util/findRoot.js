const path = require('path')
const fs = require('fs')

module.exports = (done, rootPathArgv) => {
  const root =
    rootPathArgv
      ? path.resolve(
        path.isAbsolute(rootPathArgv) ? '' : process.cwd(),
        rootPathArgv
      )
      : null
  if (root) {
    fs.access(root, (err) => {
      if (err) {
        done(new Error('Root path could not be found!'))
      } else {
        done(null, root)
      }
    })
  } else {
    const gitRootDir = (dir) => (
      fs.promises.readdir(dir, { withFileTypes: true })
        .then((files) => {
          for (const file of files) {
            if ((file.name === '.git') && file.isDirectory()) return dir
          }
          if (dir !== '/') return gitRootDir(path.resolve(dir, '..'))
        })
    )
    gitRootDir(process.cwd()).then((gitRoot) => {
      if (!gitRoot) {
        done(new Error('Unable to locate root of git project!'))
      } else {
        done(null, gitRoot)
      }
    })
  }
}
