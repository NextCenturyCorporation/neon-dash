pipeline {
  agent none
  stages {
    stage('Fetch dependencies') {
      agent {
        docker 'node:12-alpine'
      }
      steps {
        sh 'npm install'
        stash includes: 'node_modules/', name: 'node_modules'
      }
    }  
    stage('Lint') {
      agent {
        docker 'node:12-alpine'
      }
      steps {
        unstash 'node_modules'
        sh 'npm run lint'
      }
    }
    stage('Compile') {
      agent {
        docker 'node:12-alpine'
      }
      steps {
        unstash 'node_modules'
        sh 'npm run build-prod'
        stash includes: 'dist/', name: 'dist'
      }
    }
    // stage('Unit Test') {
    //   agent {
    //     docker 'circleci/node:12-stretch-browsers'
    //   }
    //   steps {
    //     unstash 'node_modules'
    //     sh 'npx ng test'
    //     junit 'reports/**/*.xml'
    //   }
    // }
    // stage('E2E Test') {
    //   agent {
    //     docker 'circleci/node:12-stretch-browsers'
    //   }
    //   steps {
    //     unstash 'node_modules'
    //     sh 'mkdir -p reports'
    //     sh './e2e.sh'
    //     junit 'reports/**/*.xml'
    //   }
    // }
  }
}