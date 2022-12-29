# UnityBuilder
Unity build, deployment and automatic upgrade of the version

Assemble the exe file and add it to the project with unity.
Create a unityBuilder.env file 

`.env`
```
PROJECT_NAME = myProject
LATEST_TAG = latest
SSH_HOST = user@address
REMOTE_DIR = /home/images
PROJECT_PATH = ./
BUILD_PATH =  ./builds
```