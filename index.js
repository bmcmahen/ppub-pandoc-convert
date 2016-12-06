var Promise = require('bluebird');
var defaultMarkdownParser =  require('prosemirror-markdown').defaultMarkdownParser;
var write = require('fs-writefile-promise')
var colors = require('colors');
var execPromise = require('child-process-promise').exec;

var outputFilePath = 'pandocAST-Attempt.json';
var markdown = '*Italicss* \n\n**Boldss**';
var parentNodes = []; // stack for keeping track of the last node : )
var outputParentNodes = []; // stack for keeping track of the last output node
var blocks = []; // blocks is eventually set to this array.

var pandocJSON = {};
var docJSON = defaultMarkdownParser.parse(markdown)

/*********** **** **** **** **** **** **************************
 ********** * ** * ** * ** * ** * ** * *************************
 *********** **** **** **** **** **** **************************
 *************  ***  ***  ***  ***  ****************************/

function buildPandocAST(){
	cyan(`Traversing docJSON`, true);
	cyan(JSON.stringify(docJSON.toJSON()));

	function scanFragment( fragment, position) {
		parentNodes.push(fragment);
		if (fragment.content){
			fragment.content.forEach((child, offset) => scan(child, position + offset));
		}
	}

	// Create a node
	// If node is a root node, push it to blocks
	function scan(node, position) {
		green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(parentNodes)}\nOutputParentNodes:\t${JSON.stringify(outputParentNodes)}\n`)
		let newNode = {};
		let markCount = 0;

		switch(node.type){
			case "heading":
				let level = node.attrs.level;
				newNode.t = "Header";
				newNode.c = [];
				newNode.c[0] = level;
				newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
				newNode.c[2] = [];
				createNode(newNode);
				blocks.push(newNode);
				break;
			case "text":
				if (node.marks){
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
				break;
			case "image":
				newNode.t = "Image";
				newNode.c = [];
				newNode.c[0] = ["",[],[]]; // Don't fully understand this lol
				newNode.c[1] = createTextLeaves(node.attrs.alt)
				newNode.c[2] = [node.attrs.src, ""];
				createNode(newNode)
				break;
			case "paragraph":
				newNode.t = "Para";
				newNode.c = [];

				createNode(newNode);
				blocks.push(newNode);
				break;
			default:
				red(`Hit default, returning ( Unprocessable node of type ${node.type} )`);
				return;
				break; // this probably isn't necessary lol
		}

		scanFragment(node, position + 1)

		while (markCount > 0){
			markCount--;
			blue('popping output: Mark')
			outputParentNodes.pop();
			parentNodes.pop(); // Why do this?? Do you need to do this bc I don't think so
			// ^^ Because these aren't parent Ndoes in docJSON
		}

		if (node.type === 'paragraph' || node.type === 'heading'){
			blue('popping output: Paragraph or Heading')
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
	words = words.trim().split(" ")
	for (let i = 0; i < words.length; i++){
		// if (words[i] == "") continue;
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
		yellow(`parent type is ${parent.t}, parent is ${JSON.stringify(parent)}, outerParentNodes is ${JSON.stringify(outputParentNodes)}`)
		if (parent.t === "Para" || parent.t === "Emph" || parent.t === "Strong"){
			parent.c.push(newNode)
			blue(`1: pushing output to: \t${JSON.stringify(outputParentNodes)}`)
			outputParentNodes.push(newNode)
		} else {
			parent.c[2].push(newNode);
		}
	}
	else {
		blue(`2: pushing output to: \t${JSON.stringify(outputParentNodes)}`)
		outputParentNodes.push(newNode)
	}
	parent = outputParentNodes[outputParentNodes.length-1];
	yellow(`paren NOW is ${JSON.stringify(parent)}`)
}

buildPandocAST();








/*** Debugging    utility functions ****************** * * * * *
 *** *******    ************************************** * * * * *
 *** *****    **************************************** * * * * *
 *** ***    ****************************************** * * * * *
 *** *    ******************************************** * * * * */

function green(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.green);
		return;
	}
	console.log(colors.green(words) +'\n');
}

function yellow(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.yellow);
		return;
	}
	console.log(colors.yellow(words) +'\n');
}

function red(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.red);
		return;
	}
	console.log(colors.red(words) +'\n');
}

function blue(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.blue);
		return;
	}
	console.log(colors.blue(words) +'\n');
}

function cyan(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.cyan);
		return;
	}
	console.log(colors.cyan(words) +'\n');
}

function white(words, heading){
	if (heading){
		console.log('\n\t\t' + words.underline.white);
		return;
	}
	console.log(colors.white(words) +'\n');
}
