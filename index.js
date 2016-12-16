var Promise = require("bluebird");
var defaultMarkdownParser =  require("prosemirror-markdown").defaultMarkdownParser;
var write = require("fs-writefile-promise")
var colors = require("colors");
var execPromise = require("child-process-promise").exec;
var docJSON = require('./docJSON.json');
// var markdown = "`inline code goes here`";

var currentDocJSONNodeParents = []; // stack for keeping track of the last node : )
var currentPandocNodeParents = []; // stack for keeping track of the last output node
var blocks = []; // blocks (pandoc AST) is eventually set to this array.

var fs = require('fs');
// var markdown = fs.readFileSync('pandocAST.md').toString();

// var docJSON = require('./md.json');

// var docJSON = defaultMarkdownParser.parse(markdown).toJSON();
var pandocJSON = {};

var inTable = false;

/*********** **** **** **** **** **** **************************
 ********** * ** * ** * ** * ** * ** * *************************
 *********** **** **** **** **** **** **************************
 *************  ***  ***  ***  ***  ****************************/

function buildPandocAST(){
	cyan(`Traversing docJSON`, true);
	cyan(JSON.stringify(docJSON));

	function scanFragment( fragment, position) {
		blue("Pushing:\t" + JSON.stringify(fragment.type));

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
						} else if (node.marks[i].type === "link"){
							newerNode = {};
							newerNode.t = "Link";
							newerNode.c = [["",[],[ ]], [], [node.marks[i].attrs.href, node.marks[i].attrs.title || "" ]];
							newerNodes.push(newerNode)
							markCount++;
						} else if (node.marks[i].type === "code"){
							newerNode = {};
							newerNode.t = "Code";
							newerNode.c = [["",[],[ ]], node.text];
							newerNodes.push(newerNode)
							markCount++;
						}
					}
				}
				break;
			case "image":
				newNode.t = "Image";
				newNode.c[0] = ["",[],[]]; // Don"t fully understand this lol
				newNode.c[1] = node.attrs.alt ? createTextNodes(node.attrs.alt) : [];
				newNode.c[2] = [node.attrs.src, ""];
				break;
			case "paragraph":
				red("HIT PARAGRAPH BRAH \n"+JSON.stringify(currentDocJSONNodeParents))
				if (currentDocJSONNodeParents[currentDocJSONNodeParents.length-1].type === "list_item"){
					newNode.t = "DoNotAddThisNode";
					break;
				}
				red("YERP")
				if (inTable){
					newNode.t = "Plain";
				} else {
					newNode.t = "Para";
				}
				break;
			case "horizontal_rule":
				newNode.t = "HorizontalRule";
				break;
			case "blockquote":
				newNode.t = "BlockQuote";
				break;
			case "bullet_list":
				newNode.t = "BulletList"

				break;
			case "ordered_list":
				newNode.t = "OrderedList";
				newNode.c[0] = [ // Not super sure this conversion is right
					1, {
						"t": "DefaultStyle"
					},
					{
						"t": "Period"
					}
				]
				newNode.c[1] = [];
				break;
			case "list_item":
				newNode.t = "Plain";
				break;
			case "table":
				inTable = true;
				newNode.t = "Table";
				newNode.c[0] = [];
				newNode.c[1] = []; // Should have {t: "AlignDefault"} for every column
				newNode.c[2] = []; // Should have a 0 for every column
				newNode.c[3] = []; // Column Titles
				newNode.c[4] = []; //  Column content
				var columns = node.attrs.columns;
				for (let i = 0; i < columns; i++){
					newNode.c[1].push({t: "AlignDefault"});
					newNode.c[2].push(0);
				}

				break;
			case "table_row":
				// newNode.t = "Plain";
				newNode.t = "DoNotAddThisNode";
				break;
			case "table_cell":
				// newNode.t = "Plain";
				// May have to change to plain, and remove the paragraph inTable -> plain
				// change the paragraph in table plain to donotaddthisnode
				newNode.t = "DoNotAddThisNode";
				break;

			default:
				red(`Unprocessable node of type ${node.type}`);
				return;
				break;
		}

		for (var i = 0; i < newerNodes.length; i++){
			addNode(newerNodes[i]);
		}

		if (node.type === "text"){  // should this be or plain? o:
			var isCode = false;
			if (node.marks){
				for (var i = 0; i < node.marks.length; i++){
					if (node.marks[i].type === "code"){
						green('is code! :D', true);
						isCode = true;
					}
				}
			}
			if (isCode){

			} else {
				var newNodes = createTextNodes(node.text);
				for (var i in newNodes) {
					addNode(newNodes[i])
				}
			}
		} else{
			addNode(newNode);
		}

		scanFragment(node, position + 1)

		while (markCount > 0){
			markCount--;
			currentPandocNodeParents.pop();
			// currentDocJSONNodeParents.pop(); // Why do this?? Do you need to do this bc I don"t think so
			// ^^ Because these aren"t parent Ndoes in docJSON
		}

		// This is NOT sufficient, I think. Blocks can be nested in blocks.
		if (node.type === "paragraph" || node.type === "heading"
		 || node.type === "horizontal_rule" || node.type === "blockquote"
		 || node.type === "bullet_list" || node.type === "ordered_list"
	 	 || node.type === "list_item" || node.type === "table"
	 	 || node.type === "table_row" || node.type === "table_cell"){
			currentDocJSONNodeParents.pop();
		}
		if (newNode.t === "Para" || newNode.t=== "Header"
			|| newNode.t === "HorizontalRule" || newNode.t ==="Blockquote"
			|| newNode.t === "BulletList" || newNode.t === "OrderedList"
			|| newNode.t === "Tableg"){
				blue("popping:\t" + JSON.stringify(currentPandocNodeParents))

			currentPandocNodeParents.pop();
		} else if (inTable){
			if (newNode.t === "Plain"){
				currentPandocNodeParents.pop();
			}
		}


		if (node.type === "text"){
			blue("Popping " + JSON.stringify(node.type));

			currentPandocNodeParents.pop();
			currentDocJSONNodeParents.pop();
		}
		if (node.type === "table"){
			inTable = false;
		}
	}
	scanFragment(docJSON, 0)

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
	if (newNode.t === "DoNotAddThisNode"){
		return;
	}

	yellow(`addNode: ${newNode.t}`, true)
	yellow(`blocks: ${JSON.stringify(blocks)}`)
	var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];
	yellow(`parent: ${JSON.stringify(parent)}`)
	if (parent){
		yellow(`parent type is ${parent.t}, parent is ${JSON.stringify(parent)}, outerParentNodes is ${JSON.stringify(currentPandocNodeParents)}, current node type is ${newNode.t}`)
		if (parent.t === "Table"){
			var numCols = parent.c[2].length; // how do you know that's columns and not rows
			if (parent.c[3].length < numCols){
				red("YESYEs", true)
				parent.c[3].push([newNode]) // c3 is for header data.
			} else {
				for (var i =0; i < 100 ; i++){
					if (!parent.c[4][i]){
						parent.c[4][i] = [];
					}
					if (parent.c[4][i].length < numCols){
						parent.c[4][i].push([newNode])
						break;
					}
				}
				// if (parent.c[4][parent.c[4].length-1].length < numCols ){
				//
				// 	parent.c[4].push([[newNode]])
				// } else {
				//  parent.c[4].push([newNode])
				// }
			}
			currentPandocNodeParents.push(newNode)
		} else if (parent.t ==="Link" || parent.t === "Code"){
			parent.c[1].push(newNode);
		} else if (parent.t === "BulletList"){
			// parent.c[0] = [];
			// parent.c[0] = [];
			parent.c.push([newNode])
			currentPandocNodeParents.push(newNode) // Ahh may be buggy

		} else if (parent.t === "OrderedList"){
			parent.c[1].push([newNode])
			currentPandocNodeParents.push(newNode) // Ahh may be buggy

		} else if (parent.t === "BlockQuote" || parent.t === "Para" || parent.t === "Emph" || parent.t === "Strong" || parent.t === "Plain"){
			parent.c.push(newNode)
			yellow(`1: pushing output to: \t${JSON.stringify(currentPandocNodeParents)}`)
			if (parent.t !== "Para" && parent.t !== "Plain"){
				currentPandocNodeParents.push(newNode)
			} else if ((parent.t === "Plain" ) && inTable){
				red("HELLO YES PUSHING THE PARANT LOL HAHA")

				currentPandocNodeParents.push(newNode)
			}
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
		return execPromise(`pandoc -f JSON pandocAST-Attempt.json -t markdown-simple_tables+pipe_tables -o pandocAST-Converted.md`);
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
