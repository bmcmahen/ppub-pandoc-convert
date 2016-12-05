var Promise = require('bluebird');
var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')

const execPromise = require('child-process-promise').exec;

// var markdown = '# title paragraph\nParagraph stuff\n\nA new line with an image ![Image](http://commonmark.org/help/images/favicon.png)';
var markdown = '# Hello ![GitHub Logo](/images/logo.png)';
var docJSON = defaultMarkdownParser.parse(markdown)


let parentNodes = []; // stack for keeping track of the last node : )
let outputParentNodes = []; // stack for keeping track of the last output node
// let outputParentNode = null;

let blocks = []; // blocks is eventually set to this array.

var outputFilePath = 'pandocAST-Attempt.json'

// Initialize the output file
var pandocJSON = {}

function traverse(){
	console.log(`Traversing docJSON`)
	console.log(JSON.stringify(docJSON.toJSON()));


	function scanFragment( fragment, position) {
		parentNodes.push(fragment);
		if (fragment.content){
			fragment.content.forEach((child, offset) => scan(child, position + offset))
			outputParentNodes.pop();

		}

	}
	function scan(node, position) {

		let newNode = {};

		if (node.type === 'heading'){

			let level = node.attrs.level;
			newNode.t = "Header";
			newNode.c = [];
			newNode.c[0] = level;
			newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
			newNode.c[2] = [];
			// blocks.push(newNode);
			createNode(newNode);
			blocks.push(newNode);
			outputParentNodes.push(newNode);

		}

		let newNodes = [];
		// Text becomes an array of nodes
		if (node.type === 'text'){

			// let words =  node.text.split(" ");
			newNodes = generateTextNodes(node.text);
			// blocks.push(newNodes); // ????? Nooo
			// outputParentNodes.push(newNodes); ?? I think text is a leaf so don't have to push
			for (var i in newNodes) {
				createNode(newNodes[i])
			}
		}

		if (node.type === 'image'){
			console.log('an image')
			newNode.t = "Image";
			newNode.c = [

			];
			newNode.c[0] = ["",[

			],[

			]]; // Don't fully understand this lol
			newNode.c[1] = generateTextNodes(node.attrs.alt)
			newNode.c[2] = [node.attrs.src, ""];
			// blocks.push(newNode); // ????? Nooo
			createNode(newNode)
			// outputParentNodes.push(newNode);
		}



		scanFragment(node, position + 1)
		parentNodes.pop();
	}
	scanFragment(docJSON.toJSON(), 0)
	pandocJSON.blocks = blocks;
	pandocJSON["pandoc-api-version"] = [
			1,
			17,
			0,
			4
		];
		pandocJSON.meta = {};

	finish();
}


function finish(){
	console.log('finish called')
	return write(outputFilePath, JSON.stringify(pandocJSON, null, "\t"))
	.then(function(fn){
		console.log('written')
		return execPromise(`pandoc -f JSON pandocAST.json -t commonmark -o pandocAST.md`);
	})
	.then(function(idk){
		console.log(`done converting`)
	})
	.catch((error)=>{
		console.log("crap an erorr")
	})
}

function generateTextNodes(words){
	let newNodes = [];
	words = words.split(" ")
	console.log('words is ' + words)
	for (let i = 0; i < words.length; i++){
		if (words[i] == "") continue;
		newNodes.push({t: "Str", c: words[i]})
		if (i < words.length - 1){
			newNodes.push({t: "Space"})
		}
	}
	return newNodes;
}

function createNode(newNode){
	console.log(`blocks is ${JSON.stringify(blocks)}`)
	var parent = outputParentNodes[outputParentNodes.length-1];
	console.log(`parent is ${JSON.stringify(parent)}`)
	if (parent){
		parent.c[2].push(newNode);
	} else {
		outputParentNodes.push(newNode)
	}
}


traverse();
