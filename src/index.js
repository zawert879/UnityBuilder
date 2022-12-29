const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), 'unityBuilder.env') })
require('./env')
const fs = require('fs')
const { execSync } = require('child_process')
let task = ''
const tasks = ['build_linux', 'build_docker', 'deploy', 'commit_update_version']
process.argv.forEach(arg => {
  const param = arg.split('=')
  if (param.length === 2) {
    process.env[param[0].toUpperCase()] = param[1]
  } else {
    if (tasks.includes(arg)) {
      task = arg
    }
  }
})

if (!process.env.VERSION) {
  const projectSettings = fs.readFileSync('./ProjectSettings/ProjectSettings.asset', 'utf8')
  let version = projectSettings.match(/bundleVersion:.*/gm)[0].split(': ')[1]
  versionSplitted = version.split('.')
  versionSplitted[2] = +versionSplitted[2] + 1
  process.env.VERSION = versionSplitted.join('.')
}

function exec(command, { textOnStart = '', textOnFinish = '', textOnFailed = '', stdio = 'inherit' }) {
  try {
    log(textOnStart)
    execSync(command, { stdio: stdio })
    log(textOnFinish)
  } catch (error) {
    throw new Error(textOnFailed)
  }
}
function log(text) {
  if (text != '') console.log(`\x1b[34m${text} \x1b[0m`)
}
function buildLinux() {
  exec(
    `${process.env.UNITY_APP} -batchmode -nographics -logfile Logs/build_linux.log -projectPath ${process.env.PROJECT_PATH} -bundleVersion ${process.env.VERSION} -buildPath ${process.env.BUILD_PATH}/${process.env.VERSION}/game-server.x86_64  -executeMethod ScriptedBuilds.Linux -quit`,
    {
      textOnStart: `Building linux! Version: ${process.env.VERSION}`,
      textOnFinish: 'Building linux complete!',
      textOnFailed: 'Building linux failed',
    }
  )
}
function checkDocker() {
  exec(`docker ps`, {
    stdio: 'ignore',
    textOnFailed: 'Docker daemon is not running!',
  })
}
function buildDocker() {
  exec(
    `docker build -f ./docker/linux/Dockerfile . --build-arg VERSION=${process.env.VERSION} -t ${process.env.PROJECT_NAME}:${process.env.VERSION} --platform linux/amd64`,
    {
      textOnStart: 'Building Docker!',
      textOnFailed: 'Building Docker failed',
    }
  )
  exec(
    `docker tag ${process.env.PROJECT_NAME}:${process.env.VERSION} ${process.env.PROJECT_NAME}:${process.env.LATEST_TAG}`,
    {
      textOnFailed: 'Tagging Docker failed',
    }
  )
  log('Building Docker complete!')
}
function deploy() {
  exec(
    `docker save -o ${process.env.PROJECT_NAME}_${process.env.VERSION} ${process.env.PROJECT_NAME}:${process.env.LATEST_TAG}`,
    {
      textOnStart: 'Deploying',
      textOnFailed: 'Docker save failed',
    }
  )
  exec(
    `scp ./${process.env.PROJECT_NAME}_${process.env.VERSION} ${process.env.SSH_HOST}:${process.env.REMOTE_DIR}/${process.env.PROJECT_NAME}_${process.env.VERSION}`,
    {
      textOnStart: 'SCP',
      textOnFailed: 'SCP failed',
    }
  )
  exec(
    `ssh ${process.env.SSH_HOST} "docker load -i ${process.env.REMOTE_DIR}/${process.env.PROJECT_NAME}_${process.env.VERSION}"`,
    {
      textOnStart: 'SSH',
      textOnFailed: 'SSH failed',
    }
  )
  exec(`del ${process.env.PROJECT_NAME}_${process.env.VERSION}`, {
    textOnStart: 'rm',
    textOnFailed: 'rm failed',
  })
  log('Deploying Docker complete!')
}
function commitUpdateVersion() {
  exec(`git commit -m 'updateVersion' ./ProjectSettings/ProjectSettings.asset`, {
    textOnStart: 'Commit',
    textOnFailed: 'Commit failed',
  })
  exec(`git push`, {
    textOnStart: 'Push',
    textOnFailed: 'Push failed',
  })
}

function all() {
  buildLinux()
  buildDocker()
  deploy()
  commitUpdateVersion
}

function runTask() {
  try {
    checkDocker()
    switch (task) {
      case 'build_linux':
        buildLinux()
        break
      case 'build_docker':
        buildDocker()
        break
      case 'deploy':
        deploy()
      case 'commit_update_version':
        commitUpdateVersion()
      default:
        all()
        break
    }
    log('FINISH')
  } catch (error) {
    console.error(`\x1b[31m${error.message}\x1b[0m`)
  }
}

runTask()

setTimeout(() => {}, 3000)
