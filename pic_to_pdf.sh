#!/bin/bash
# File: pic_to_pdf.sh
# Date: Fri Jan 11 14:55:04 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

if [[ -z "$1" ]]; then
	echo "Usage: pic_to_pdf.sh <folder>"
	exit
fi

if [[ ! -d "$1" ]]; then
	echo "Not a directory!"
	exit
fi

rename .png .jpg $1/*.png
FILES=`find $1 -type f -name "*.jpg"`
rm temp
mkdir temp
for i in $FILES; do
	echo $i
	BASE=$(echo $i | sed 's/.*\///g; s/.jpg//g')
	convert $i temp/$BASE.pdf
done
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile="$1".pdf temp/*.pdf

