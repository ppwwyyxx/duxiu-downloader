#!/bin/bash -e
# File: grey.sh
# Date: Sun Mar 02 11:14:21 2014 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>
if [[ -z "$1" ]]; then
	echo "Usage: grey.sh <folder>"
	exit
fi

OUTPUT=`basename $1`
GREY=grey-$OUTPUT

cd $1
parallel -P 20 convert -set colorspace Gray -separate -average {} ../$GREY/{} ::: *.png
