all: check

check:
	jshint js/app.js

upload-app:
	ssh www-data@infdot.com mkdir -p /var/www/estimator
	scp -r css js img index.html www-data@infdot.com:/var/www/estimator/

doc:
	docco js/app.js

upload-doc: doc
	ssh www-data@infdot.com mkdir -p /var/www/estimator/doc
	scp docs/* www-data@infdot.com:/var/www/estimator/doc/

release: check upload-app

.PHONY: check upload-app doc

