var Promise = require("bluebird");
var defaultMarkdownParser =  require("prosemirror-markdown").defaultMarkdownParser;
var write = require("fs-writefile-promise")
var colors = require("colors");
var execPromise = require("child-process-promise").exec;

var markdown = "*Italicss* \n\n**Boldss**\n\n---";

var currentDocJSONNodeParents = []; // stack for keeping track of the last node : )
var currentPandocNodeParents = []; // stack for keeping track of the last output node
var blocks = []; // blocks (pandoc AST) is eventually set to this array.

var docJSON = defaultMarkdownParser.parse(markdown)
var pandocJSON = {};

/*********** **** **** **** **** **** **************************
 ********** * ** * ** * ** * ** * ** * *************************
 *********** **** **** **** **** **** **************************
 *************  ***  ***  ***  ***  ****************************/

function buildPandocAST(){
	cyan(`Traversing docJSON`, true);
	cyan(JSON.stringify(docJSON.toJSON()));

	function scanFragment( fragment, position) {
		currentDocJSONNodeParents.push(fragment);
		if (fragment.content){
			fragment.content.forEach((child, offset) => scan(child, position + offset));
		}
	}

	// Create a node
	// If node is a root node, push it to blocks array
	// If not then just
	function scan(node, position) {
		green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(currentDocJSONNodeParents)}\nOutputParentNodes:\t${JSON.stringify(currentPandocNodeParents)}\n`)
		var newNode = {t: undefined, c: []};
		var newerNodes = []; // Used for strong and emphasis text
		var markCount = 0; // count the number of strong or emphasis applied to text

		switch(node.type){
			case "heading":
				var level = node.attrs.level;
				newNode.t = "Header";
				newNode.c[0] = level;
				newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
				newNode.c[2] = [];
				break;
			case "text":
				if (node.marks){
					for (var i = 0; i < node.marks.length; i++){
						var newerNode;
						if (node.marks[i].type === "em"){
							newerNode = {};
							newerNode.t = "Emph";
							newerNode.c = [];
							newerNodes.push(newerNode)

							markCount++;
						} else if (node.marks[i].type === "strong"){
							newerNode = {};
							newerNode.t = "Strong";
							newerNode.c = [];
							newerNodes.push(newerNode)
							markCount++;
						}
					}
				}
				break;
			case "image":
				newNode.t = "Image";
				newNode.c[0] = ["",[],[]]; // Don"t fully understand this lol
				newNode.c[1] = createTextNodes(node.attrs.alt)
				newNode.c[2] = [node.attrs.src, ""];
				break;
			case "paragraph":
				newNode.t = "Para";
				break;
			case "horizontal_rule":
			newNode.t = "HorizontalRule";
				break;
			default:
				red(`Hit default, returning ( Unprocessable node of type ${node.type} )`);
				return;
				break;
		}

		for (var i = 0; i < newerNodes.length; i++){
			addNode(newerNodes[i]);
		}

		if (node.type === "text"){
			var newNodes = createTextNodes(node.text);
			for (var i in newNodes) {
				addNode(newNodes[i])
			}
		} else {
			addNode(newNode);
		}

		scanFragment(node, position + 1)

		while (markCount > 0){
			markCount--;
			blue("popping output: Mark")
			currentPandocNodeParents.pop();
			// currentDocJSONNodeParents.pop(); // Why do this?? Do you need to do this bc I don"t think so
			// ^^ Because these aren"t parent Ndoes in docJSON
		}

		// This is NOT sufficient, I think. Blocks can be nested in blocks.
		if (node.type === "paragraph" || node.type === "heading"
		 || node.type === "horizontal_rule" || node.type === "blockquote"){
			blue("popping output: Paragraph / Header")
			currentPandocNodeParents.pop();
			currentDocJSONNodeParents.pop();
		}
		if (node.type === "text"){
			currentPandocNodeParents.pop();
			currentDocJSONNodeParents.pop();
		}
	}
	scanFragment(docJSON.toJSON(), 0)

	finish();
}

function createTextNodes(words){
	var newNodes = [];
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

function addNode(newNode){
	yellow(`addNode: ${newNode.t}`, true)
	yellow(`blocks: ${JSON.stringify(blocks)}`)
	var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];
	yellow(`parent: ${JSON.stringify(parent)}`)
	if (parent){
		yellow(`parent type is ${parent.t}, parent is ${JSON.stringify(parent)}, outerParentNodes is ${JSON.stringify(currentPandocNodeParents)}`)
		if (parent.t === "Para" || parent.t === "Emph" || parent.t === "Strong"){
			parent.c.push(newNode)
			yellow(`1: pushing output to: \t${JSON.stringify(currentPandocNodeParents)}`)
			currentPandocNodeParents.push(newNode)
		} else {
			parent.c[2].push(newNode);
		}
	}
	else {
		yellow(`2: pushing output to: \t${JSON.stringify(currentPandocNodeParents)}`)
		currentPandocNodeParents.push(newNode)
		blocks.push(newNode);
	}
	parent = currentPandocNodeParents[currentPandocNodeParents.length-1];
	yellow(`parent is now ${JSON.stringify(parent)}`)
}


/* Write the file, and convert it back to make sure it was successful :D
 *********************************************************************
 *********************************************************************/

function finish(){
	pandocJSON.blocks = blocks;
	pandocJSON["pandoc-api-version"] = [
		1,
		17,
		0,
		4
	];
	pandocJSON.meta = {};

	return write("pandocAST-Attempt.json", JSON.stringify(pandocJSON, null, "\t"))
	.then(function(fn){
		console.log("written")
		return execPromise(`pandoc -f JSON pandocAST-Attempt.json -t commonmark -o pandocAST.md`);
	})
	.then(function(idk){
		console.log(`done converting`)
	})
	.catch((error)=>{
		console.log("crap an erorr " + error)
	})
}


buildPandocAST();

/*** Debugging    utility functions ****************** * * * * *
 *** *******    ************************************** * * * * *
 *** *****    **************************************** * * * * *
 *** ***    ****************************************** * * * * *
 *** *    ******************************************** * * * * */

function green(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.green);
		return;
	}
	console.log(colors.green(words) +"\n");
}

function yellow(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.yellow);
		return;
	}
	console.log(colors.yellow(words) +"\n");
}

function red(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.red);
		return;
	}
	console.log(colors.red(words) +"\n");
}

function blue(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.blue);
		return;
	}
	console.log(colors.blue(words) +"\n");
}

function cyan(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.cyan);
		return;
	}
	console.log(colors.cyan(words) +"\n");
}

function white(words, heading){
	if (heading){
		console.log("\n\t\t" + words.underline.white);
		return;
	}
	console.log(colors.white(words) +"\n");
}
