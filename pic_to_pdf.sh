#!/bin/bash
# File: pic_to_pdf.sh
# Date: Sun Jan 20 00:41:43 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

if [[ -z "$1" ]]; then
	echo "Usage: pic_to_pdf.sh <folder>"
	exit
fi

if [[ ! -d "$1" ]]; then
	echo "Not a directory!"
	exit
fi

OUTPUT=`basename $1`
TMP=tmp$OUTPUT

rename .png .jpg $1/*.png
FILES=`find $1 -type f -name "*.jpg"`
mkdir $TMP -p
cd $1
parallel -P 20 convert {} {.}.pdf ::: *.jpg
mv ./*.pdf ../$TMP/
cd ..

gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile="$OUTPUT".pdf $TMP/*.pdf

rm $TMP -r
