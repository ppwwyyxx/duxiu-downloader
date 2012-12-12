introduction:
============
	download pdf books available in duxiu.com through '图书馆文献传递'


usage:
=====
	get the link of available pages through '图书馆文献传递'

	$ mkdir book
	$ coffee duxiu.coffee <link> ./book
	$ ./pic_to_pdf.sh


dependencies:
============
	node packages:
		request
		coffee

	ghostscript(gs)
	imagemagick(convert)
