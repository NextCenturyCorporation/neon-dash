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
        stash includes: 'node_modules/', name: 'node_modules'
      }
    }  
    
    stage('Lint') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'npm run lint'
      }
    }
   
    stage('Unit Test') {
      agent {
        docker 'circleci/node:12-stretch-browsers'
      }
      steps {
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'npx ng test --reporters junit --browsers ChromeJenkins || true'
        junit testResults: 'reports/unit/**/*.xml', allowEmptyResults: false, healthScaleFactor: 100.0
      }
    }

    stage('E2E Test') {
      agent {
        docker 'circleci/node:12-stretch-browsers'
      }
      environment {
        E2E_JUNIT = "1"
      }
      steps {
        unstash 'node_modules'
        sh 'mkdir -p reports'
        sh './e2e.sh'
        junit 'reports/e2e/**/*.xml'
      }
    }

    stage('Compile') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'npm run build-prod'
        stash includes: 'dist/', name: 'dist'
      }
    }
  }
}