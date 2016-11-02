#!/bin/bash
set -e

until nc -v -z mysql 3306; do echo Waiting for Database; sleep 1; done

until nc -v -z hoster 8100; do echo Waiting for Hoster; sleep 1; done

if [ "$NODE_ENV" = "development" ]
then
    node_modules/nodemon/bin/nodemon.js src/index.js
else
    npm start
fi
