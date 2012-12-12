#!/bin/bash
# File: a.sh
# Date: Wed Dec 12 09:47:02 2012 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

FILES=`find . -type f -name "*.jpg" | cut -d/ -f 2`
mkdir temp && cd temp
for i in $FILES; do
	BASE=$(echo $i | sed 's/.jpg//g')
	convert $i temp/$BASE.pdf
done
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=out.pdf temp/*.pdf

