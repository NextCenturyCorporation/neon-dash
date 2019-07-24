pipeline {
  agent none
  
  environment {
    PATH = "/usr/local/bin:/usr/bin:/usr/sbin:/bin:/sbin"
    HOME = "."
    npm_config_cache = "npm-cache"
    DO_LINT=false
    DO_UNIT_TEST=true
    DO_E2E_TEST=true
    DO_S3_DEPLOY=true
  }

  options {
    timestamps()
  }

  stages {
    stage('Fetch dependencies') {
      agent {
        docker {
          image 'node:12-stretch'
          args '--network=host'
        }
      }
      steps {
        sh 'npm install'
        stash includes: 'node_modules/', name: 'node_modules'
      }
    }  
    
    stage('Lint') {
      agent {
        docker {
          image 'node:12-stretch'
          args '--network=host'
        }
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

    stage('Compile') {
      agent {
        docker {
          image 'node:12-stretch'
          args '--network=host'
        }
      }
      steps {
        sh 'mkdir -p node_modules'
        sh 'chmod -R u+w node_modules'
        unstash 'node_modules'
        sh 'npm run build-prod'

        stash includes: 'dist/', name: 'dist'
      }
    }

    stage('Unit Test') {
      agent {
        docker {
          image 'circleci/node:12-stretch-browsers'
          args '--network=host'
        }
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
        sh script: 'npx ng test --reporters junit --browsers ChromeJenkins', returnStatus: true

        stash name:'unit-results', includes:'reports/unit/**/*.xml'       
      }
    }

    stage('E2E Test') {
      when {
        expression {
          "$DO_E2E_TEST" != "false"
        }
      }
      agent {
        docker {
          image 'circleci/node:12-stretch-browsers'
          args '--network=host'
        }
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

        // Prep CI Config 
        sh script: './e2e-ci.sh', returnStatus: true
        stash name:'e2e-results', includes:'reports/e2e/**/*.xml'
      }
    }

    stage('Publish Test Results') {
      agent any
      when {
        expression {
          "$DO_E2E_TEST" != "false" || "$DO_UNIT_TEST" != "false"
        }
      }
      steps {
        sh 'mkdir -p reports'
        sh 'chmod -R u+w reports'
        script {
          if ("$DO_E2E_TEST" != "false") {
            unstash 'e2e-results'
          }
          if ("$DO_UNIT_TEST" != "false") {
            unstash 'unit-results'
          }
        }
        junit testResults: 'reports/**/*.xml',  keepLongStdio: true, allowEmptyResults: false
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
        docker {
          image 'hashicorp/terraform'
          args '--network=host --entrypoint=""'
        }
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
          sh "cp src/app/config/cicd/lorelei.config.yaml src/app/config.yaml || echo 'none'"
          sh "cp src/app/config/cicd/${BRANCH_NAME.toLowerCase()}.config.yaml src/app/config.yaml || echo 'none'"
          sh "aws s3 sync src/app/config 's3://${BRANCH_NAME.toLowerCase()}.nc-demo.com/app/config'" 
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