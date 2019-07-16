pipeline {
  agent none
  
  environment {
    PATH = "/usr/local/bin:/usr/bin:/usr/sbin:/bin:/sbin"
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
        stash includes: 'node_modules/', name: 'node_modules', excludes: '**/*.md,**/LICENSES,**/package.json'
      }
    }  
    
    stage('Lint') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        unstash 'node_modules'
        sh 'npm run lint'
      }
    }
   
    stage('Unit Test') {
      agent {
        docker 'circleci/node:12-stretch-browsers'
      }
      steps {
        unstash 'node_modules'
        sh 'npx ng test --reporters junit'
        junit 'reports/**/*.xml'
      }
    }

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


    stage('Compile') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        unstash 'node_modules'
        sh 'npm run build-prod'
        stash includes: 'dist/', name: 'dist'
      }
    }
  }
}