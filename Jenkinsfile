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
        sh 'npm install'
        sh 'npm run lint'
      }
    }
    stage('Compile/Test') {
      parallel {
        stage('Compile') {
          agent {
            docker {
              image 'node:12-stretch'
              args '--network=host'
            }
          }
          steps {
            sh 'npm install'
            sh 'npm run build-prod'

            sh "cp src/app/config/cicd/lorelei.config.yaml dist/app/config/config.yaml || echo 'none'"
            sh "cp src/app/config/cicd/${BRANCH_NAME.toLowerCase()}.config.yaml dist/app/config/config.yaml || echo 'none'"

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
            sh 'npm install'
            sh 'mkdir -p reports/unit'
            sh script: 'npx ng test --reporters junit --browsers ChromeJenkins', returnStatus: true

            stash name:'unit-results', includes:'reports/unit/**/*.xml'       
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
        docker {
          image 'circleci/node:12-stretch-browsers'
          args '--network=host'
        }
      }
      environment {
        E2E_JUNIT = "1"
      }
      steps {
        sh 'npm install'
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
          anyOf { branch 'master'; branch 'THOR-jenkins-pipeline'; }
      }
      steps {
         withCredentials([usernamePassword(
          credentialsId: 'aws_jenkins',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'                              
        )]) {
          sh 'rm  ~/.dockercfg || true'
          sh 'rm ~/.docker/config.json || true'
          sh 'pip3 install awscli --user'
          
          sh 'mkdir -p dist'
          sh 'chmod -R u+w dist'
          unstash 'dist'

          sh """sed -i \\'\\' \\'s/host: localhost/host: elasticsearch/g\\' dist/app/config/config.yaml"""

          script {
            //configure registry
            sh("eval \$(aws ecr get-login --no-include-email --region us-east-1 | sed 's|https://||')")
            docker.withRegistry('https://670848316581.dkr.ecr.us-east-1.amazonaws.com') {
               
                //build image
                def customImage = docker.build("neon/ui:${env.BUILD_ID}")
                 
                //push image
                customImage.push()
                customImage.push('latest')
            }        
          } 
        }
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
        docker {
          image 'ughly/alpine-aws-cli'
          args '--network=host'
        }
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