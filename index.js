var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')

var markdown = '# title paragraph\nParagraph stuff';
var docJSON = defaultMarkdownParser.parse(markdown);

console.log(JSON.stringify(docJSON.toJSON()));
var outputFilePath = 'pandocAST.json'

// Initialize the output file
var pandocJSON = {
	"blocks": [
		{
			"t":"Para",
			"c": [] // Where all the file data goes : )
		}
	],
	"pandoc-api-version":[
		1,
		17,
		0,
		4
	],
	"meta":{
		'converted-from-docjson': true
	}
}

function start(){

}


function finish(){
	return write(outputFilePath, JSON.stringify(pandocJSON))
	.then(function(fn){
		console.log('written')
	})
	.catch((error)=>{
		console.log("crap an erorr")
	})
}
