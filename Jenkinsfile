pipeline {
  agent none
  
  environment {
    PATH = "$PATH:/usr/bin:/usr/sbin:/bin:/sbin"
    HOME = "."
    npm_config_cache = "npm-cache"
  }

  stages {
    stage('Fetch dependencies') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        sh 'npm install'
        stash includes: 'node_modules/', name: 'deps'
      }
    }  
    
    stage('Lint') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        unstash 'deps'
        sh 'npm run lint'
      }
    }
   
    stage('Unit Test') {
      agent {
        docker 'circleci/node:12-stretch-browsers'
      }
      steps {
        unstash 'deps'
        sh 'npx ng test --reporters junit'
        junit 'reports/**/*.xml'
      }
    }

    // stage('E2E Test') {
    //   agent {
    //     docker 'circleci/node:12-stretch-browsers'
    //   }
    //   steps {
    //     unstash 'deps'
    //     sh 'mkdir -p reports'
    //     sh './e2e.sh'
    //     junit 'reports/**/*.xml'
    //   }
    // }


    stage('Compile') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        unstash 'deps'
        sh 'npm run build-prod'
        stash includes: 'dist/', name: 'dist'
      }
    }
  }
}