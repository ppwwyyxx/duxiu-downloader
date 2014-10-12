#!/bin/bash
# File: pic_to_pdf.sh
# Date: Thu Jan 23 23:45:32 2014 +0800
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

#rename .png .jpg $1/*.png

# parallel -P 20 convert {} -set colorspace Gray -separate -average {.}.png ::: *.png
FILES=`find $1 -type f -name "*.png"`
mkdir $TMP -p
cd $1
parallel -P 20 gm convert {} {.}.pdf ::: *.png
#parallel -P 20 convert {} {.}.tiff ::: *.png
#parallel -P 20 tiff2pdf {} -o {.}.pdf ::: *.tiff
mv ./*.pdf ../$TMP/
#rm ./*.tiff
cd ..

#pdfunite $TMP/*.pdf "$OUTPUT".pdf
#rm $TMP -r
