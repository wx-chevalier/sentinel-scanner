#!/bin/bash

echo "start install node_modules"
yarn install

echo "start build ts"
yarn run tsc