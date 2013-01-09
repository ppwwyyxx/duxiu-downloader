#!/bin/bash
# File: pic_to_pdf.sh
# Date: Wed Jan 09 21:25:10 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

FILES=`find . -type f -name "*.jpg"`
mkdir temp
for i in $FILES; do
	echo $i
	BASE=$(echo $i | sed 's/.*\///g; s/.jpg//g')
	convert $i temp/$BASE.pdf
done
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=out.pdf temp/*.pdf

