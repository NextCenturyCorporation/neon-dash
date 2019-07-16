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
        sh 'mkdir -p node_modules'
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
        sh 'mkdir -p node_modules'
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'mkdir -p reports/unit'
        sh 'npx ng test --reporters junit --browsers ChromeJenkins || true'
        junit testResults: 'reports/unit/**/*.xml', allowEmptyResults: false, healthScaleFactor: 100.0
      }
    }

    stage('Compile') {
      agent {
        docker 'node:12-stretch'
      }
      steps {
        sh 'mkdir -p node_modules'
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'npm run build-prod'
        stash includes: 'dist/', name: 'dist'
      }
    }
    
    stage('E2E Setup') {
      steps {
        sh 'mkdir -p dist node_modules'
        sh 'chmod -R u+w node_modules dist'
        unstash 'node_modules'
        unstash 'dist'
        
        sh 'cd e2e/docker && docker-compose  --no-ansi up -d'

        timeout(120) {
          waitUntil {
            def r = sh script: 'curl -s "localhost:9199/_search?size=0&q=*" | grep \'"total":[^0]\' ',  returnStatus: true;
            return (r == 0);
          }
        }
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
        sh 'mkdir -p dist node_modules'
        sh 'chmod -R u+w node_modules dist'
        unstash 'node_modules'
        unstash 'dist'
        sh 'mkdir -p reports/e2e'
        sh 'ls node_modules/protractor/node_modules/webdriver-manager/selenium || npx webdriver-manager update'
        sh 'npx protractor e2e/docker/protractor.conf.js'
        junit 'reports/e2e/**/*.xml'
      }
    }
  }

  post {
    always {
      sh 'cd e2e/docker && docker-compose  --no-ansi down'
    }
  }
}