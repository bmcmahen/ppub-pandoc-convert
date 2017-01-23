# ProseMirror to Pandoc Converter

Convert from PuPubs ProseMirror format to Pandocs JSON format

### Dependencies

- pandoc
- pandoc-citeproc

---

### Usage

`node index.js fileToConvert.json`

This will produce fileToConvert-pandoc.json as well as a .bib file with a random name. To produce a nice PDF, run `pandoc --bibliography *.bib test-pub-cite-pandoc.json --filter=pandoc-citeproc --csl chicago-fullnote-bibliography.csl --latex-engine=pdflatex  -o 1.pdf`.

You can also use it by requiring it. `require('./index').pubToPandoc(docJSON)`.

### Test

`npm test`
