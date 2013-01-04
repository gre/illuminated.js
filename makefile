help:
	@echo "usage: make gendocs|docsserver\n\n\
	gendocs\t\t Generate documentation and output to docs directory.\n\
	docsserver\t Run YUIDoc in server mode while editing documentation."

srcpath = src
themepath = docstheme

docs: $(srcpath)/* $(themepath)/*
	yuidoc

docsserver: $(srcpath)
	yuidoc --server
