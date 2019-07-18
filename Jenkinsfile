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
      when {
        expression {
          false
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
    
  //   stage('E2E Setup') {
  //     steps {
  //         sh 'mkdir -p dist node_modules'
  //         sh 'chmod -R u+w node_modules dist'
  //         unstash 'node_modules'
  //         unstash 'dist'

  //         sh 'cd e2e/docker && docker-compose  --no-ansi up -d'
  //         script {
  //           timeout(120) {
  //             waitUntil {
  //               def r = sh script: 'curl -s "localhost:9199/_search?size=0&q=*" | grep \'"total":[^0]\' ',  returnStatus: true;
  //               r == 0;
  //             }
  //           }
  //         }
  //     }
  //   }

  //   stage('E2E Test') {
  //     agent {
  //       docker 'circleci/node:12-stretch-browsers'
  //     }
  //     environment {
  //       E2E_JUNIT = "1"
  //     }
  //     steps {
  //       sh 'mkdir -p dist node_modules'
  //       sh 'chmod -R u+w node_modules dist'
  //       unstash 'node_modules'
  //       unstash 'dist'
  //       sh 'mkdir -p reports/e2e'
  //       sh 'ls node_modules/protractor/node_modules/webdriver-manager/selenium || npx webdriver-manager update'
  //       sh 'npx protractor e2e/docker/protractor.conf.js'
  //       junit 'reports/e2e/**/*.xml'
  //     }
  //   }
  // 

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
      agent {
        docker 'hashicorp/terraform'
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'aws_jenkins',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'                              
        )]) {
          ws("${env.WORKSPACE}/terraform") {
            sh "rm -rf .terraform"
            sh "terraform init --backend-config='key=${BRANCH_NAME}'"
            sh "terraform apply -var 'branch=${BRANCH_NAME}' -auto-approve -input=false"
          }
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
          sh "aws s3 sync dist 's3://${BRANCH_NAME}.nc-demo.com'"
        }
      }
    }
  }

  // post {
  //   always {
  //     sh 'cd e2e/docker && docker-compose  --no-ansi down'
  //   }
  // }
}