#!/bin/sh

set -ex

docker build -t zihao/play:hextile -f deploy/Dockerfile .
docker push zihao/play:hextile
kubepatch play-hextile
