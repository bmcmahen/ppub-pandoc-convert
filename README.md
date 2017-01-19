# ProseMirror to Pandoc Converter

Convert from PuPubs ProseMirror format to Pandocs JSON format

### Dependencies

- pandoc
- pandoc-citeproc

---

### Usage

`node index.js fileToConvert.json`

This will produce fileToConvert-pandoc.json which you can then play with. To produce a nice PDF, run `pandoc --bibliography *.bib test-pub-cite-pandoc.json --filter=pandoc-citeproc --csl chicago-fullnote-bibliography.csl --latex-engine=pdflatex  -o 1.pdf`.

You can also use it by requiring it. `require('./index')({docJSON: docJSON})` or `require('./index')({fl: filename.json})`

### Test

`npm test`
