#!/usr/bin/env bash
cd /home/ec2-user/earmark-backend
npm i
npm run clean
npm run build
npm run start