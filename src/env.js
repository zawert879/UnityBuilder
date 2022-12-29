const env = {
  PROJECT_NAME: process.env.PROJECT_NAME, 
  LATEST_TAG: process.env.LATEST_TAG,
  SSH_HOST: process.env.SSH_HOST,
  REMOTE_DIR: process.env.REMOTE_DIR,
  PROJECT_PATH: process.env.PROJECT_PATH,
  BUILD_PATH: process.env.BUILD_PATH,
}

Object.keys(env).forEach(_key => {
  const key = _key
  if (env[key] === undefined) {
    console.error(`💩 Hey! Environment ${key} not set`)
  }
})
