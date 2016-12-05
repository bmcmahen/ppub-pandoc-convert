var Promise = require('bluebird');
var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')

var colors = require('colors');

const execPromise = require('child-process-promise').exec;

// var markdown = '# title paragraph\nParagraph stuff\n\nA new line with an image ![Image](http://commonmark.org/help/images/favicon.png)';
var markdown = '*Italicss* \n\n**Boldss**';
var docJSON = defaultMarkdownParser.parse(markdown)


let parentNodes = []; // stack for keeping track of the last node : )
let outputParentNodes = []; // stack for keeping track of the last output node
// let outputParentNode = null;

let blocks = []; // blocks is eventually set to this array.

var outputFilePath = 'pandocAST-Attempt.json';

// Initialize the output file
var pandocJSON = {};

function traverse(){
	console.log(`Traversing docJSON`);
	console.log(JSON.stringify(docJSON.toJSON()));


	function scanFragment( fragment, position) {
		parentNodes.push(fragment);
		if (fragment.content){
			fragment.content.forEach((child, offset) => scan(child, position + offset));
		}
	}

	function scan(node, position) {
		console.log('Scanning')
		green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(parentNodes)}\nOutputParentNodes:\t${JSON.stringify(outputParentNodes)}\n`)
		let newNode = {};

		if (node.type === 'heading'){
			let level = node.attrs.level;
			newNode.t = "Header";
			newNode.c = [];
			newNode.c[0] = level;
			newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
			newNode.c[2] = [];

			createNode(newNode);
			blocks.push(newNode);


		}
		let markCount = 0;

		// Text becomes an array of nodes
		if (node.type === 'text'){
			if (node.marks){
				green('Found marks')
				for (let i = 0; i < node.marks.length; i++){
					let newerNode;
					if (node.marks[i].type === 'em'){
						newerNode = {};
						newerNode.t = "Emph";
						newerNode.c = [];
						createNode(newerNode);

						markCount++;
					}
					if (node.marks[i].type === 'strong'){
						newerNode = {};
						newerNode.t = "Strong";
						newerNode.c = [];
						createNode(newerNode);

						markCount++;
					}
				}
			}

			let newNodes = [];
			// let words =  node.text.split(" ");
			newNodes = createTextLeaves(node.text);
			// blocks.push(newNodes); // ????? Nooo
			// outputParentNodes.push(newNodes); ?? I think text is a leaf so don't have to push
			for (var i in newNodes) {
				createNode(newNodes[i])
			}
		}

		if (node.type === 'image'){
			console.log('an image')
			newNode.t = "Image";
			newNode.c = [];
			newNode.c[0] = ["",[],[]]; // Don't fully understand this lol
			newNode.c[1] = createTextLeaves(node.attrs.alt)
			newNode.c[2] = [node.attrs.src, ""];
			createNode(newNode)
		}

		if (node.type === 'paragraph'){
			console.log('a paragraph')
			newNode.t = "Para";
			newNode.c = [];

			createNode(newNode);
			blocks.push(newNode);

		}

		scanFragment(node, position + 1)

		while (markCount > 0){
			markCount--;
			outputParentNodes.pop();
			parentNodes.pop();

		}

		if (node.type === 'paragraph' || node.type === 'heading'){
			console.log("POPPING OUTPUT PARENT NODE WE HAVE " + JSON.stringify(outputParentNodes))
			outputParentNodes.pop();
			parentNodes.pop();

		}
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

	return write(outputFilePath, JSON.stringify(pandocJSON, null, "\t"))
	.then(function(fn){
		console.log('written')
		return execPromise(`pandoc -f JSON pandocAST-Attempt.json -t commonmark -o pandocAST.md`);
	})
	.then(function(idk){
		console.log(`done converting`)
	})
	.catch((error)=>{
		console.log("crap an erorr " + error)
	})
}

function createTextLeaves(words){
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
	console.log(newNode.t)
	var parent = outputParentNodes[outputParentNodes.length-1];
	console.log(`parent is ${JSON.stringify(parent)}`)
	if (parent){
		if (parent.t === "Para" || parent.t === "Emph" || parent.t === "Strong"){
			parent.c.push(newNode)
			outputParentNodes.push(newNode)
		} else {
			parent.c[2].push(newNode);
		}
	}
	else {
		outputParentNodes.push(newNode)
	}
	parent = outputParentNodes[outputParentNodes.length-1];
	yellow(`paren NOW is ${JSON.stringify(parent)}`)
}

function green(words){
	console.log(colors.green(words));
}

function yellow(words){
	console.log(colors.yellow(words));
}


traverse();
