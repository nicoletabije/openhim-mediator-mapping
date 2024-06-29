@echo off
REM Stop the container if running, ignore errors if not found
docker stop mapping-connect-backend || true
REM Remove the container if it exists, ignore errors if not found
docker rm -f mapping-connect-backend || true
REM Build the Docker image
docker build -t mapping-connect-backend .
REM Run the Docker container
docker run -e OPENHIM_URL=https://openhim-core:8080 -e MONGO_URL=mongodb://mapper-mongo-1:27017,mapper-mongo-2:27017,mapper-mongo-3:27017/mapping-mediator?replicaSet=mapper-mongo-set --network mapper-cluster-network --name mapper -d mapping-connect-backend
