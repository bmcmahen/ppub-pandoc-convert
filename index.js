var Promise = require('bluebird');
var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')

const execPromise = require('child-process-promise').exec;

// var markdown = '# title paragraph\nParagraph stuff\n\nA new line with an image ![Image](http://commonmark.org/help/images/favicon.png)';
var markdown = '# Title\n\n# Another Title';

var docJSON = defaultMarkdownParser.parse(markdown)


console.log(JSON.stringify(docJSON.toJSON()));
var outputFilePath = 'pandocAST.json'

// var count = 0;
// Initialize the output file
var pandocJSON = {
	"blocks": [

	],
	"pandoc-api-version":[
		1,
		17,
		0,
		4
	],
	"meta":{
		// "converted-from-docjson": "true"
	}
}

function traverse(){
	console.log(`Traversing docJSON`)
	console.log(docJSON)
	function scanFragment( fragment, position ) {
		fragment.forEach((child, offset) => scan(child, position + offset))
	}
	function scan(node, position) {
		console.log(`\nnode at position ${position} is`)
		console.log(node)
		console.log('\n\n')
		if ( node.isText ) {
			console.log('looking at textnode')
			console.log(node)
		}
		scanFragment(node.content, position + 1)
	}
	scanFragment(docJSON, 0)
}

function start(){

	// console.log('docJSON:' + docJSON + '\n\n' + docJSON.content)
	const content = docJSON.content.content;
	console.log(content)
	console.log(content.length)


	for (let i = 0; i < content.length; i++ ){
		console.log(`visiting node ${i}, have ${content[i]}`)
		visit(content[i]);
	}
	// Need to traverse docJSON.content
	// pandocJSON.blocks.c.push({..lol})
	finish();

}

function visit(node){
	console.log(`\n\nvisit`)
	console.log(node)
	console.log(node.type.name)
	console.log(node.content)
	let newNode = {};
	switch(node.type.name){
		case "heading":
		console.log('yep heading')
		let level = node.attrs.level;
		newNode.t = "Header";
		newNode.c = [];
		newNode.c[0] = level;
		newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
		newNode.c[2] = [];

		console.log(node.content)
		console.log(node.content.content)
		console.log(node.content.content[0].text)


		// Every word needs to be space separated in pandocAST
		let words =  node.content.content[0].text.split(" ");
		for (let i = 0; i < words.length; i++){
			newNode.c[2].push({t: "Str", c: words[i]})

			//if not at last word add a space
			if (i < words.length -1){
				newNode.c[2].push({t: "Space"})
			}
		}

		console.log('\n\n PUSHING NEW NODE '+JSON.stringify(newNode))

		pandocJSON.blocks.push(newNode);

		break;
	}
}


function finish(){
	return write(outputFilePath, JSON.stringify(pandocJSON))
	.then(function(fn){
		console.log('written')
		return execPromise(`pandoc -f JSON pandocAST.json -t commonmark -o pandocAST.md`);
	})
	.then(function(idk){
		console.log(`done converting`)
		// console.log(`return is ${JSON.stringify(idk)}`)
	})
	.catch((error)=>{
		console.log("crap an erorr")
	})
}

// start();
traverse();
