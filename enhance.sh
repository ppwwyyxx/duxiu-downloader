#!/bin/bash -e
# File: enhance.sh
# Date: Fri Sep 13 15:09:51 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

for i in $@; do
	basename=$(echo $i | sed 's/\.[^\/]*$//g')
	echo $basename
	convert -contrast-stretch 1000x1000 $i "$basename"_enhance.png
	convert -level 25%,90% "$basename"_enhance.png "$basename"_final.png
	rm "$basename"_enhance.png
done
