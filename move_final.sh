#!/bin/bash -e
# File: move_final.sh
# Date: Fri Sep 13 15:10:44 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

[[ -z "$1" ]] && $1="."
for i in $1/*_final.png; do
	orig=$(echo $i | sed 's/_final//g')
	mv $i $orig -f
done
