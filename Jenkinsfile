pipeline {
  agent none
  
  environment {
    PATH = "/usr/local/bin:/usr/bin:/usr/sbin:/bin:/sbin"
    HOME = "."
    npm_config_cache = "npm-cache"
    DO_LINT=true
    DO_UNIT_TEST=true
    DO_E2E_TEST=false
    DO_S3_DEPLOY=true
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
      when {
        expression {
          "$DO_LINT" != "false"
        }
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
      when {
        expression {
          "$DO_UNIT_TEST" != "false"
        }
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
    
    stage('Build nginx container') {
      agent any
      when {
          branch 'master'
      }
      steps {
        sh 'which docker-compose'
      } 
    }


    stage('Setup AWS Branch Setup') {
      when {
        expression {
          "$DO_S3_DEPLOY" != "false"
        }
      }
      agent {
        docker 'hashicorp/terraform'
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'aws_jenkins',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'                              
        )]) {
          sh "cd terraform && rm -rf .terraform"
          sh "cd terraform && terraform init --backend-config='key=${BRANCH_NAME}'"
          sh "cd terraform && terraform apply -var 'branch=${BRANCH_NAME}' -auto-approve -input=false"
        }
      }
    }

    stage('Deploy assets to S3 bucket') {
      agent {
        docker 'ughly/alpine-aws-cli'
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'aws_jenkins',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'                              
        )]) {
          sh 'mkdir -p dist'
          sh 'chmod -R u+w dist'
          unstash 'dist'
          sh "aws s3 sync dist 's3://${BRANCH_NAME.toLowerCase()}.nc-demo.com'"
          sh "cp src/app/config/cicid/lorelei.config.yaml src/app/config.yaml"
          sh "cp src/app/config/cicd/${BRANCH_NAME}.yaml src/app/config.yaml || echo 'none'"
          sh "aws s3 sync src/app/config 's3://${BRANCH_NAME.toLowerCase()}.nc-demo.com/app/config'" 
        }
      }
    }
    stage('E2E Setup') {
      when {
        expression {
          "$DO_E2E_TEST" != "false"
        }
      }
      steps {
          sh 'mkdir -p dist node_modules'
          sh 'chmod -R u+w node_modules dist'
          unstash 'node_modules'
          unstash 'dist'

          sh 'cd e2e/docker && docker-compose  --no-ansi up -d'
          script {
            timeout(120) {
              waitUntil {
                def r = sh script: 'curl -s "localhost:9199/_search?size=0&q=*" | grep \'"total":[^0]\' ',  returnStatus: true;
                r == 0;
              }
            }
          }
      }
    }

    stage('E2E Test') {
      when {
        expression {
          "$DO_E2E_TEST" != "false"
        }
      }
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

  // post {
  //   always {
  //     sh 'cd e2e/docker && docker-compose  --no-ansi down'
  //   }
  // }
}