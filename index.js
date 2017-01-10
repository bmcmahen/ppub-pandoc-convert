var Promise = require("bluebird");
var defaultMarkdownParser =  require("prosemirror-markdown").defaultMarkdownParser;
var write = require("fs-writefile-promise")
var colors = require("colors");
var execPromise = require("child-process-promise").exec;
var docJSON = require('./joi-extract2.json');
// var markdown = "`inline code goes here`";

var currentDocJSONNodeParents = []; // stack for keeping track of the last node : )
var currentPandocNodeParents = []; // stack for keeping track of the last output node
var blocks = []; // blocks (pandoc AST) is eventually set to this array.

var fs = require('fs');

// var docJSON = require('./md.json');
// var markdown = fs.readFileSync('pandocAST.md').toString();
// var docJSON = defaultMarkdownParser.parse(markdown).toJSON();
var pandocJSON = {};

var inTable = false;
var col; // used when within a table, to keep track of current pandoc col
var row; // used when within a table, to keep track of current pandoc row

/*********** **** **** **** **** **** **************************
 ********** * ** * ** * ** * ** * ** * *************************
 *********** **** **** **** **** **** **************************
 *************  ***  ***  ***  ***  ****************************/

function buildPandocAST(){
	cyan(`Traversing docJSON`, true);
	cyan(JSON.stringify(docJSON));

	function scanFragment(fragment) {

		blue("doc pushing " + fragment.type)
		currentDocJSONNodeParents.push(fragment);
		if (fragment.content) {
			fragment.content.forEach((child, offset) => scan(child));
		}
	}

	// Create a node
	// If node is a root node, push it to blocks array
	function scan(node) {
		// green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(currentDocJSONNodeParents)}\nOutputParentNodes:\t${JSON.stringify(currentPandocNodeParents)}\n`)
		var newNode = {t: undefined, c: []};
		var newerNodes = []; // Used primarily for strong, emphasis, link, code text
		var markCount = 0; // Used to count strong, emphasis, link, code text, the reason being that you can have newer nodes that aren't marks

		switch(node.type){
			case "block_embed": // Cases: Image in table
				newNode.t = "Image";
				newNode.c[0] = ["",[],[]]; // Don"t fully understand this lol
				newNode.c[1] = [];
				newNode.c[2] = [node.attrs.data.content.url, ""];
				break;
			case "heading":
				var level = node.attrs.level;
				newNode.t = "Header";
				newNode.c[0] = level;
				newNode.c[1] = ["",[],[]]; // Don't fully understand this lol
				newNode.c[2] = [];
				break;
			case "text":
				// Marks are handled here and the rest of it is handled later
				if (node.marks){
					for (var i = 0; i < node.marks.length; i++){
						var newerNode;
						if (node.marks[i].type === "em"){
							newerNode = {};
							newerNode.t = "Emph";
							newerNode.c = [];
							newerNodes.push(newerNode)
							markCount++;
						} else if (node.marks[i]._ === "em"){
							// the ._ is weird, but in this pub: https://www.pubpub.org/pub/joichi-itos-research-statement---march-2016
							// the Salon des Refuses uses _ instead of type
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
						} else if (node.marks[i].type === "link" ){
							newerNode = {};
							newerNode.t = "Link";
							newerNode.c = [["",[],[ ]], [], [node.content.text, node.marks[i].attrs.title || "" ]];
							newerNodes.push(newerNode)
							markCount++;
						} else if (node.marks[i]._ === "link"){
							// the ._ is weird, but in this pub: https://www.pubpub.org/pub/joichi-itos-research-statement---march-2016
							// the link within the ordered list a the bottom isn't under type..

							newerNode = {};
							newerNode.t = "Link";
							newerNode.c = [["",[],[ ]], [/*Should get populated in addNode*/], [node.marks[i].href, node.marks[i].title || "" ]];
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
				// Let's actually create Paragraph nodes when text nodes are seen, as opposed to when paragraph nodes are seen
				if (currentDocJSONNodeParents[currentDocJSONNodeParents.length-1].type === "list_item"){
					red("PARENT IS LIST ITEM")
					newNode.t = "DoNotAddThisNode";
					break;
				}
				if (inTable && currentPandocNodeParents[currentPandocNodeParents.length-1].t === "Plain" && currentPandocNodeParents[currentPandocNodeParents.length-2].t === "Table"){
					newNode.t = "DoNotAddThisNode";
				} else {
					// This is the proper way to handle Para -- one to one with docJSOn paragraph
					// Because otherwise have issues with Para : [text, text]
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
				col = -1;
				row = -1;
				newNode.t = "Table";
				newNode.c[0] = [];
				newNode.c[1] = []; // Should have {t: "AlignDefault"} for every column
				newNode.c[2] = []; // Should have a 0 for every column
				newNode.c[3] = []; // Column Titles
				newNode.c[4] = []; // Column content
				var columns = node.attrs.columns;
				for (let i = 0; i < columns; i++){
					newNode.c[1].push({t: "AlignDefault"});
					newNode.c[2].push(0);
				}

				break;
			case "table_row":
				// newNode.t = "Plain";
				newNode.t = "DoNotAddThisNode";
				row++;
				col = -1;
				break;
			case "table_cell":
				col++;
				newNode.t = "Plain";
				break;
			case "embed":
				//Adding support for footnotes
				if (node.attrs.mode === "cite"){
					newNode.t = "Note";
					newNode.c[0] = { t: "Para", c: createTextNodes(node.attrs.data.content.note)}
				}

				break;
			default:
				red(`Uh oh...Unprocessed node of type ${node.type}`);
				newNode.t = "DoNotAddThisNode";
				break;
		}

		// Wrap all images in a div block, PubPub doesn't do inline images
		if (newNode.t === "Image"){
			// red("divdiv")
			// var div = {}; // Not sure any of this is correct, not sure how to compare to actual output
			// div.t = "Div";
			// div.c = [];
			// div.c[0] = ["", [], []]; // Attributes
			// div.c[1] = []; // Contents
			// newerNodes.push(div);

		}

		for (var i = 0; i < newerNodes.length; i++){
			addNode(newerNodes[i]);
		}

		if (node.type === "text") {  // should this be or plain? o:
			var isCode = false;
			if (node.marks){
				for (var i = 0; i < node.marks.length; i++){
					if (node.marks[i].type === "code"){
						isCode = true;
					}
				}
			}
			if (isCode){

			} else {
				var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];

				yellow(`PARENT: ${JSON.stringify(parent)}`)
				if (parent && parent.c[0] && parent.t === "Para"){
					// Close the parent Paragraph node and open a new one.
					// Because this will create a newline, and is how Pandoc does it
					// Not doing it for plain, because of an edge case when its in OL->[Link, Str]

					// Okay this is breaking a period after an emphasis, or whenevr there is
					// [Text, Text with marks, Text], because it puts a newline after text with marks

					// blue("YEs HERE, parent is " + JSON.stringify(parent), true)
					// var _newNode = {t: "Para", c: []}
					// currentPandocNodeParents.pop();
					// addNode (_newNode);
					// blue("OK NOW parent is " + JSON.stringify(parent), true)

				}

				var newNodes = createTextNodes(node.text);
				for (var i in newNodes) {
					addNode(newNodes[i])
				}

			}
		} else {
			addNode(newNode);
		}
		// context is some global variable
		// const oldContext = context.clone();
		// if (node.type === "table_cell") {
		// 	context.column = columns++;
		// 	context.row = rows++;
		// }
		scanFragment(node)
		// context = oldContext;

		// This is NOT sufficient, I think. Blocks can be nested in blocks.
		if (node.type === "paragraph" || node.type === "heading"
		 || node.type === "horizontal_rule" || node.type === "blockquote"
		 || node.type === "bullet_list" || node.type === "ordered_list"
	 	 || node.type === "list_item" || node.type === "table"
	 	 || node.type === "table_row" || node.type === "table_cell"
	 	 || node.type === "block_embed" || node.type === "text" ){
			 // Just moved text back into here..
		 	red("doc: popping " + node.type)
			currentDocJSONNodeParents.pop();
			red("Now parent is " + currentDocJSONNodeParents[currentDocJSONNodeParents.length-1].type)
		}
		if (newNode.t === "Para" || newNode.t === "Plain"
		  || newNode.t === "Header" || newNode.t === "Code"
			|| newNode.t === "HorizontalRule" || newNode.t === "Blockquote"
			|| newNode.t === "BulletList" || newNode.t === "OrderedList"
			|| newNode.t === "Table" || newNode.t === "Image"
			|| newNode.t === "Note" || newNode.t === "Link"){
				// Link is for the case UL->[Link, Str]
				// blue(`Popping 1 - ${JSON.stringify(newNode.t)}`)
			currentPandocNodeParents.pop();
		} else if (inTable) {
			if (newNode.t === "Plain"){
				// blue(`Popping 2 - ${JSON.stringify(newNode.t)}`)
				currentPandocNodeParents.pop();
			}
		}
		if (node.type === "text"){ // Text creates a STR node in addition to newNode
			if (!isCode){ // Ehh.. Not 100% sure about this
				// blue(`Popping 3 - (text/Str)`)
				// currentPandocNodeParents.pop();
			}
		}

		while (markCount > 0){
			// blue('Popping mark')
			markCount--;
			currentPandocNodeParents.pop();
			// currentDocJSONNodeParents.pop(); // Why do this?? Do you need to do this bc I don"t think so
			// ^^ Because these aren"t parent Ndoes in docJSON
		}

		if (node.type === "table"){
			inTable = false;
		}
	}
	scanFragment(docJSON, 0)

	finish();
}

function createTextNodes(words){
	var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];


	var newNodes = [];
	// words = words.trim(); // No longer trim, but might be necessary to protect from bugs, the reason I don't is when there is a Link or another thing, followed by text it'll get rid of the leading space
	words = words.split(" ")
	console.log(words)
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
	var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];

	if (parent){

		if (parent.t === "Table"){
			console.log("Yeah parent is table")
			console.log(`pushing to ${row}, ${col}`)
			var numCols = parent.c[2].length; // how do you know that's columns and not rows
			if (row < 1){
				// parent.c[3].push([newNode]) // c3 is for header data.
				if (!parent.c[3][col]){
					parent.c[3][col] = [];
				}
				console.log(`inserting at c[3][${col}]`)

				parent.c[3][col].push(newNode)
			} else {
				if (!parent.c[4][row-1]){
					parent.c[4][row-1] = [];
				}
				if (!parent.c[4][row-1][col]){
					parent.c[4][row-1][col] = [];
				}
				console.log(`inserting at c[4][${(row-1)}][${col}]`)

				if( row == 1 && col == 0){
					console.log(JSON.stringify(newNode))
				}

				parent.c[4][row-1][col].push(newNode)
			}
			green(`pushing ${JSON.stringify(newNode)}`)
			currentPandocNodeParents.push(newNode)
		} else if (parent.t === "Link" || parent.t === "Code"){
			parent.c[1].push(newNode);
			green(`SWEH: pushing ${JSON.stringify(newNode)}`)
			if (newNode.t === "Str" || newNode.t === "Space"){

			} else {
				currentPandocNodeParents.push(newNode); // hmm not totally sure
			}
		} else if (parent.t === "BulletList"){
			// parent.c[0] = [];
			// parent.c[0] = [];
			parent.c.push([newNode])
			green(`pushing5 ${JSON.stringify(newNode)}`)
			currentPandocNodeParents.push(newNode) // Ahh may be buggy

		} else if (parent.t === "OrderedList"){
			parent.c[1].push([newNode])
			green(`pushing6 ${JSON.stringify(newNode)}`)
			currentPandocNodeParents.push(newNode) // Ahh may be buggy
		} else if (parent.t === "BlockQuote" || parent.t === "Para" || parent.t === "Emph" || parent.t === "Strong" || parent.t === "Plain"){

			parent.c.push(newNode)
			if (parent.t !== "Para" && parent.t !== "Plain"){
				if (newNode.t === "Str" || newNode.t === "Space"){
					// These are leaf nodes, and don't need to be pushed.
					// There may be other types of leaf nodes..
				} else {
					green(`pushing a ${JSON.stringify(newNode)}`)
					currentPandocNodeParents.push(newNode)
				}
			} else if ((parent.t === "Plain" ) && inTable){
				green(`pushing2: ${JSON.stringify(newNode)}`)
				currentPandocNodeParents.push(newNode)
			} else if (parent.t === "Emph" || parent.t === "Strong" ){
				green(`pushing3: ${JSON.stringify(newNode)}`)
				red("Herp derp")

				currentPandocNodeParents.push(newNode)
			} else if (parent.t === "Para" || parent.t === "Plain"){
				// Wasn't doing this to Plain before, not sure why.
				if (newNode.t === "Str" || newNode.t === "Space"){
					// These are leaf nodes, and don't need to be pushed.
					// There may be other types of leaf nodes..
				} else {
					console.log("HIP HIP OK " + JSON.stringify(newNode))

					green(`pushing a ${JSON.stringify(newNode)}`)

					currentPandocNodeParents.push(newNode)
				}
			} else if (parent.t === "Note"){
				// blue("pushing Note : D")
				currentPandocNodeParents.push(newNode)
			}
		} else if (parent.t === "Div") {
			parent.c[1].push(newNode);
		} else {
			yellow("PARENT : " + parent.t)
			parent.c[2].push(newNode);
		}
	}
	else {
		green(`pushing10 ${JSON.stringify(newNode)}`);
		currentPandocNodeParents.push(newNode);
		blocks.push(newNode);
	}
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
		return execPromise(`pandoc -f JSON pandocAST-Attempt.json -t markdown-simple_tables+pipe_tables --atx-headers -o pandocAST-Converted.md`);
	})
	.then(function(idk){
		console.log(`done converting`)
	})
	.catch((error)=>{
		console.log(`error: ${error}`)
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
