var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')

var markdown = '# title paragraph\nParagraph stuff\n\nA new line with an image ![Image](http://commonmark.org/help/images/favicon.png)';
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
	for (let i = 0; i < )
	visit(docJSON.content[0])

	// Need to traverse docJSON.content
	// pandocJSON.blocks.c.push({..lol})
}

function visit(node){
	let newNode = {};
	switch(node.type){
	case "heading":
			let level = node.attrs.level;
			newNode.t = "Header";
			NewNode.c[0] = level;
			newNode.c[1] = []; // Don't fully understand this lol
			newNode.c[2] = [];

			// Every word needs to be space separated in pandocAST
			let words =  node.content.text.split(" ");
			for (let i = 0; i < words.length; i++){
				newNode.c[2].push({t: "Str", c: words[i]})

				//if not at last word add a space
				if (i < words.length -1){
					newNode.c[2].push({t: "Space"})
				}
				pandocJSON.blocks.push(newNode);
			}

			break;
	}
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
