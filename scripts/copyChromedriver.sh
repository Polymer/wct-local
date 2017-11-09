#!/bin/bash -xo pipefail

WORKING_DIR=`pwd`
CHROMEDRIVER_DIR=""

# Diff between npm 5 - 3
OPTIONS=(
node_modules/wct-local/node_modules/selenium-standalone
node_modules/selenium-standalone
)

for dir in "${OPTIONS[@]}"; do
	if [ -d $dir ]; then
    
    	if [ -d $WORKING_DIR/node_modules/chromedriver ]; then
    		CHROMEDRIVER_DIR=$WORKING_DIR/node_modules/chromedriver
    	else
    		CHROMEDRIVER_DIR=$WORKING_DIR/node_modules/wct-local/chromedriver
    	fi

		cp $CHROMEDRIVER_DIR/bin/chromedriver $WORKING_DIR/$dir/.selenium/chromedriver/2.27-x64-chromedriver
		cp -r $CHROMEDRIVER_DIR/lib $WORKING_DIR/$dir/.selenium/

		echo "$0 Great success"

		exit 0
	else
		echo "$0 dir $dir not found"
	fi
done



echo "$0 Directory not found ${OPTIONS[@]}"

exit 1
