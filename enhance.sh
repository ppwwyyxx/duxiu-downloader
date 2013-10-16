#!/bin/bash -e
# File: enhance.sh
# Date: Sat Sep 14 01:43:16 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

for i in $@; do
	basename=$(echo $i | sed 's/\.[^\/]*$//g')
	echo $basename
	convert -contrast-stretch 1000x1000 $i "$basename"_enhance.png
	convert -level 20%,90% "$basename"_enhance.png "$basename"_final.png
	rm "$basename"_enhance.png
done
