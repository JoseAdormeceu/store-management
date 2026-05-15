pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        DOCKERHUB_USERNAME = 'josecomsono'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'docker build -t $DOCKERHUB_USERNAME/store-frontend:latest ./frontend'
            }
        }

        stage('Build Backend') {
            steps {
                sh 'docker build -t $DOCKERHUB_USERNAME/store-backend:latest ./backend'
            }
        }

        stage('Push Images') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker push $DOCKERHUB_USERNAME/store-frontend:latest'
                sh 'docker push $DOCKERHUB_USERNAME/store-backend:latest'
            }
        }

        stage('Deploy') {
            steps {
                sh 'ansible-playbook ansible/playbook.yml -i ansible/inventory.ini'
            }
        }
    }

    post {
        success {
            mail to: 'josemourastoremanager@gmail.com',
                 subject: "Store Management — Nova versão disponível",
                 body: """Uma nova versão da aplicação Store Management foi deployada com sucesso.

A aplicação está disponível em:
- Loja: http://localhost:80
- API: http://localhost:3000

O que foi atualizado: ${env.GIT_BRANCH} — commit ${env.GIT_COMMIT}

Equipa de Desenvolvimento"""
        }
        failure {
            mail to: 'josemourastoremanager@gmail.com',
                 subject: "Store Management — Falha no deploy",
                 body: """O deploy de uma nova versão da aplicação Store Management falhou.

A versão anterior continua em funcionamento.

Por favor verifica os logs em: ${env.BUILD_URL}

Equipa de Desenvolvimento"""
        }
    }
}