list="$(find src/app/ -name '*.html' | sort)"
for file in $list; do node_modules/.bin/js-beautify -f $file --replace --type html --config .jsbeautifyrc; done

