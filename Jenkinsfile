
pipeline {
    agent any

    // Auto-trigger build on GitHub push events
    triggers {
        githubPush()
    }

    environment {
        DEPLOY_USER = 'ubuntu'
        DEPLOY_HOST = 'ec2-54-255-220-6.ap-southeast-1.compute.amazonaws.com'
        DEPLOY_DIR = '/home/ubuntu/trip_planner_agent'
        SSH_KEY_ID = 'ec2-ssh-key'
    }

    stages {
        stage('Clone Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/ihubInv/travel_agent.git', credentialsId: 'github-token'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker rmi -f genaiihub24/my-docker:frontend-app || true'
                sh 'docker rmi -f genaiihub24/my-docker:backend-app || true'
                
                sh 'docker build -t genaiihub24/my-docker:frontend-app ./frontend'
                sh 'docker build -t genaiihub24/my-docker:backend-app ./backend'
            }
        }

        stage('Archive Artifacts') {
            steps {
                sh 'tar czf deploy.tar.gz docker-compose.yml nginx frontend backend'
                archiveArtifacts artifacts: 'deploy.tar.gz'
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            mkdir -p ${DEPLOY_DIR}
                        '
                        scp -o StrictHostKeyChecking=no deploy.tar.gz ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/
                        
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            set -e
                            cd ${DEPLOY_DIR}
                            tar -xzf deploy.tar.gz
                            sudo cp nginx/nginx.conf /etc/nginx/sites-available/default
                            sudo systemctl restart nginx
                            docker-compose down || true
                            docker-compose up -d --build
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment Successful'
        }
        failure {
            echo '❌ Deployment Failed'
        }
    }
}
