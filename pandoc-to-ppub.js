/*
 * I have already implemented ppub to prosemirror
 * Now I want to implement prosemirror to ppub
 *
 *
 *
 *
 *
 *
 */

var write = require('fs-writefile-promise');
var colors = require('colors');
var fs = require('fs');
var execPromise = require('child-process-promise').exec;
var requestPromise = require('request-promise');

var csltoBibtex = require('@pubpub/prose/dist/references/csltoBibtex').csltoBibtex;


function isInline(nodeType) {
	return (['Str', 'Emph', 'Strong', 'Strikeout',
		'Superscript', 'Subscript', 'Quoted', 'Cite',
		'Code', 'Space', 'SoftBreak', 'LineBreak',
		'Math', 'Link', 'Image', 'Note'].indexOf(nodeType) !== -1);
}
function isBlock(nodeType) {
	return (['Plain', 'Para', 'CodeBlock', 'BlockQuote',
		'OrderedList', 'BulletList', 'Header', 'HorizontalRule',
		'Table'].indexOf(nodeType) !== -1);
}

/*
* @options { bibFile }
*/
function pandocToPpub(pandoc, options) {

	var ppub = {
		type: 'doc',
		content: [
			//first is article second is
			//citations
		]
	}

	var articleNode = {
		type: "article",
		content: []
	}

	var currentPandocNodeParents = []; // stack for keeping track of the last node : )
	var currentPpubNodeParents = [articleNode]; // stack for keeping track of the last output node


	console.log(colors.cyan('Starting conversion\n'));

	function isLeafNode(node) {

	}

	/* Pandoc has a Str node for each word and space, this function converts
	* strings to Pandocs format
	*/
  // Should change to fuseTextNodes
	function createTextNodes(str) {

		// var newNodes = [];
		// str = str.split(' ');
		// for (var i = 0; i < str.length; i++) {
		// 	newNodes.push({ t: 'Str', c: str[i] });
		// 	if (i < str.length - 1) {
		// 		newNodes.push({ t: 'Space' });
		// 	}
		// }
		// return newNodes;
	}


	// Create a node
	// If node is a root node, push it to blocks array
	function scan(node) {
		// green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(currentPandocNodeParents)}\nOutputParentNodes:\t${JSON.stringify(currentPpubNodeParents)}\n`)
		var newNode = { type: undefined };
		var newerNodes = [];
		var markCount = 0;

		switch (node.t) {
			case 'Image':
				newNode.type = 'embed';
        newNode.attrs = {};
        newNode.attrs.url = (node.c[2] && node.c[2][0]) ? node.c[2][0] : '';
				break;
      case 'Para':
        // if (currentPandocNodeParents[currentPandocNodeParents.length - 1].type === 'list_item') {
        // 	red('PARENT IS LIST ITEM');
        // 	newNode.t = 'Plain';
        // 	break;
        // } else if (inTable && currentPpubNodeParents[currentPpubNodeParents.length-1].t === 'Plain' && currentPpubNodeParents[currentPpubNodeParents.length-2].t === 'Table') {
        // 	newNode.t = 'DoNotAddThisNode';
        // } else {
        // 	// This is the proper way to handle Para -- one to one with ppub paragraph
        // 	// Because otherwise have issues with Para : [text, text]
        // }
				newNode.content = [];
        newNode.type = 'paragraph';

        break;
			case 'heading':
				var level = node.attrs.level;
				newNode.t = 'Header';
				newNode.c[0] = level;
				newNode.c[1] = ['', [], []];
				newNode.c[2] = [];
				break;
			case 'text':
				// Marks are handled here and the rest of it is handled later
				if (node.marks) {
					for (var i = 0; i < node.marks.length; i++) {
						var newerNode;
						if (node.marks[i].type === 'em') {
							newerNode = {};
							newerNode.t = 'Emph';
							newerNode.c = [];
							newerNodes.push(newerNode);
							markCount++;
						} else if (node.marks[i].type === 'strong') {
							newerNode = {};
							newerNode.t = 'Strong';
							newerNode.c = [];
							newerNodes.push(newerNode);
							markCount++;
						} else if (node.marks[i].type === 'link') {
							newerNode = {};
							newerNode.t = 'Link';
							newerNode.c = [['', [], []], [], [node.content.text, node.marks[i].attrs.title || '']];
							newerNodes.push(newerNode);
							markCount++;
						} else if (node.marks[i].type === 'code') {
							newerNode = {};
							newerNode.t = 'Code';
							newerNode.c = [['', [], []], node.text];
							newerNodes.push(newerNode);
							markCount++;
						} else if (node.marks[i].type === 'strike') {
							// This is an edge case and handled differently in Pandoc than link, code, strong and emph
							newNode.t = 'Strikeout';
						} else if (node.marks[i].type === 'sub') {
							// This is an edge case and handled differently in Pandoc than link, code, strong and emph
							newNode.t = 'Subscript';
						} else if (node.marks[i].type === 'sup') {
							// This is an edge case and handled differently in Pandoc than link, code, strong and emph
							newNode.t = 'Superscript';
						}
					}
				}

				break;
			// case 'image':
			// 	newNode.t = "Image";
			// 	newNode.c[0] = ["",[],[]];
			// 	// if has width & height
			// 	if (newNode.attrs.size) { // Images in the newer editor use embe not image
			// 		var widthHeightPercentage = "" + newNode.attrs.size;
			// 		newNode.c[0][2]=[["width", widthHeightPercentage], ["height", widthHeightPercentage]]
			//
			// 	}
			//
			// 	newNode.c[1] = node.attrs.alt ? createTextNodes(node.attrs.alt) : [];
			// 	newNode.c[2] = [node.attrs.src, ""];
			// 	break;

			case 'horizontal_rule':
				newNode.t = 'HorizontalRule';
				break;
			case 'blockquote':
				newNode.t = 'BlockQuote';
				break;
			case 'bullet_list':
				newNode.t = 'BulletList';
				// newNode.c[0] = [];
				console.log("Pushing to list depth stack")
				red("PUSING -1")

				listDepthStack.push(-1);
				break;
			case 'ordered_list':
				newNode.t = 'OrderedList';
				newNode.c[0] = [
					1, {
						t: 'DefaultStyle'
					},
					{
						t: 'Period'
					}
				];
				newNode.c[1] = [];
				red("PUSING -1")
				listDepthStack.push(-1);
				break;
			case 'list_item':
				newNode.t = 'DoNotAddThisNode';

				console.log("Reached a list item. " + listDepthStack)
				var depth = listDepthStack[listDepthStack.length - 1] + 1;
				listDepthStack[listDepthStack.length - 1] = depth;
				var parent = currentPpubNodeParents[currentPpubNodeParents.length - 1];
				if (parent.t === 'OrderedList'){
					parent.c[1][depth] = [];
				} else {
					parent.c[depth] = [];
				}
				console.log("new list depth stack " + listDepthStack)
				break;
			case 'table':
				// inTable = true;
				// This doesn't work for nested tables.
				col = -1;
				row = -1;
				newNode.t = 'Table';
				newNode.c[0] = [];
				newNode.c[1] = []; // Should have {t: "AlignDefault"} for every column
				newNode.c[2] = []; // Should have a 0 for every column
				newNode.c[3] = []; // Column Titles
				newNode.c[4] = []; // Column content
				var columns = node.attrs.columns;
				for (var i = 0; i < columns; i++) {
					newNode.c[1].push({ t: 'AlignDefault' });
					newNode.c[2].push(0);
				}
				break;
			case 'table_row':
				newNode.t = 'DoNotAddThisNode';
				row++;
				col = -1;
				break;
			case 'table_cell':
				col++;
				newNode.t = 'Plain';
				break;
			case 'embed':
				newNode.t = 'Image';
				newNode.c[0] = ['', [], []];
				// if has width & height
				if (node.attrs && node.attrs.size) { // Images in the newer editor use embe not image
					var widthHeightPercentage = '' + node.attrs.size;
					newNode.c[0][2] = [['width', widthHeightPercentage], ['height', widthHeightPercentage]]
				}
				newNode.c[1] = node.attrs.caption ? createTextNodes(node.attrs.caption) : [];
				newNode.c[2] = [node.attrs.url, node.attrs.figureName || ''];
				break;
			case 'citations':
				// if (node.content) {
				// 	newNode.t = 'Div';
				// 	newNode.c = [
				// 		['refs', ['references'], []],
				// 		[]
				// 	];
				// } else {
				// 	newNode.t = 'DoNotAddThisNode';
				// }

				// Create a header node that goes above that says 'References'

				var aboveNode = { t: 'Header', c: [1, ['references', ['unnumbered'], []], [{ t:'Str', 'c':'References' }]]};
				// insert this node at the root
				blocks.push(aboveNode)

				newNode.t = 'DoNotAddThisNode';

				break;
			case 'reference':
				// Footnote
				var citationId = node.attrs.citationID;

				newNode.t = 'Cite';
				newNode.c = [
					[
						{
							citationSuffix: [

							],
							citationNoteNum: 0,
							citationMode: {
								t: 'AuthorInText'
							},
							citationPrefix: [

							],
							citationId: 'item' + citationId,
							citationHash: 1 // Idk what this is
						}
					],
					[]
				];

				break;


			case 'citation':
				newNode.t = 'DoNotAddThisNode';
				var data = node.attrs.data;
				bibData.push(data);
				break;
			case 'latex':
				console.log(node)
				newNode.t = 'Math';
				newNode.c = [
					{
					t: 'InlineMath'
					},
					node.content[0].text
				];

				break;
			case 'code_block':
				newNode.t = 'CodeBlock';
				newNode.c[0] = ['',[],[]];
				newNode.c[1] = node.content[0].text;
				break;
			default:
				red(`Uh oh...Unprocessed node of type ${node.t}`);
				newNode.t = 'DoNotAddThisNode';
				break;
		}

		// Wrap all images in a para block, because Pandoc seems to do this,
		// at least in does it in files where there is just an image. It'll break if you don't
		if (newNode.t === 'Image') {
			// red('divdiv')
			var para = {};
			para.t = 'Para';
			para.c = [];
			// para.c[0] = ['', [], []]; // Attributes
			// para.c[1] = []; // Contents
			newerNodes.push(para);
			markCount++;
		}

		// If there are any node to add before the target node, like mark nodes,
		// add them here
		for (var i = 0; i < newerNodes.length; i++) {
			addNode(newerNodes[i]);
		}

		if (newNode.t === 'Strikeout' || newNode.t === 'Subscript' || newNode.t === 'Superscript') {
			// Strikeout is handled differently than other text nodes
			newNode.c = createTextNodes(node.text);
			addNode(newNode);
		} else if (node.type === 'text') {  // should this be or plain? o:
			var isCode = false;
			if (node.marks) {
				for (var i = 0; i < node.marks.length; i++) {
					if (node.marks[i].type === 'code') {
						isCode = true;
					}
				}
			}
			if (!isCode) {
				var parent = currentPpubNodeParents[currentPpubNodeParents.length-1];
				var newNodes = createTextNodes(node.text);


				yellow(`PARENT: ${JSON.stringify(parent)}`);

				for (var i in newNodes) {
					addNode(newNodes[i]);
				}
			}
		} else {
			addNode(newNode);
		}

		scanFragment(node);

		if (node.t === 'Para' || node.t === 'heading'
		|| node.t === 'horizontal_rule' || node.t === 'blockquote'
		|| node.t === 'bullet_list' || node.t === 'ordered_list'
		|| node.t === 'list_item' || node.t === 'table'
		|| node.t === 'table_row' || node.t === 'table_cell'
		|| node.t === 'Image' || node.t === 'text'
		|| node.t === '//embed' || node.t === 'latex'
		|| node.t === 'reference' || node.t === 'citation'
		|| node.t === 'citations') {
			currentPandocNodeParents.pop();
		}
		if (newNode.type === 'paragraph' || newNode.type === 'Plain'
		|| newNode.type === 'Header' || newNode.type === 'Code'
		|| newNode.type === 'HorizontalRule' || newNode.type === 'BlockQuote'
		|| newNode.type === 'BulletList' || newNode.type === 'OrderedList'
		|| newNode.type === 'Table' || newNode.type === 'embed'
		|| newNode.type === 'Note' || newNode.type === 'Link'
		|| newNode.type === 'Superscript') {
			// Link is for the case UL->[Link, Str]
			blue(`Popping 1 - ${JSON.stringify(newNode.t)}`);
			currentPpubNodeParents.pop();
		}

		// while (markCount > 0) {
		// 	blue('Popping mark');
		// 	markCount--;
		// 	currentPpubNodeParents.pop();
		// }



		if (node.type === 'bullet_list' || node.type === 'ordered_list') {
			listDepthStack.pop();
		}
	}

	// Link a node to a parent node, or make it a parent
	function addNode(newNode) {
		var parent = currentPpubNodeParents[currentPpubNodeParents.length - 1];

		blue(newNode.type)
    switch (newNode.type) {
      case 'embed':
      case 'paragraph':
        parent.content.push(newNode)
        break;
      default:
        red('Not sure how to add node ' + JSON.stringify(newNode))
        break;
    }
	}

	function scanFragment(fragment) {
    yellow('pushing fragment:\n'+JSON.stringify(fragment))
		pushPandocParent(fragment);
		if (fragment.c) {
			fragment.c.forEach((child, offset) => {
				scan(child);
			});
		}
	}

	/* Write the file, and convert it back to make sure it was successful :D
	*********************************************************************
	*********************************************************************/

	function finish(fl) {
		ppub.content.push(articleNode);
		console.log("Finished " + JSON.stringify(ppub))
		return write('bibFile.bibbblol', 'bibContents')
		.then(function() {
			return ppub;
		})
		.catch(function(error) {
			console.log(error);
		});
	}

  cyan('Going to run on pandoc ' + JSON.stringify(pandoc))

	function pushPpubParent(newParent) {
		console.log('pushing ppub parent ' + JSON.stringify(newParent));
		currentPpubNodeParents.push(newParent);
	}
	function popPpubParent(newParent) {
		console.log('pushing ppub parent ' + JSON.stringify(newParent));
		return currentPpubNodeParents.pop();
	}

	function pushPandocParent(newParent) {
		console.log('pushing pandoc parent ' + JSON.stringify(newParent));
		currentPandocNodeParents.push(newParent);
	}

  function popPandocParent(newParent) {
    console.log('popping pandoc parent ' + JSON.stringify(newParent))
    return currentPandocNodeParents.pop();

  }


  for (var i = 0; i < pandoc.blocks.length; i++) {
    scanFragment(pandoc.blocks[i], 0);
  }

	return finish();
}



/*** Debugging    utility functions ****************** * * * * *
*** *******    ************************************** * * * * *
*** *****    **************************************** * * * * *
*** ***    ****************************************** * * * * *
*** *    ******************************************** * * * * */

function green(words, heading) {
	if (heading) {
		console.log('\n\t\t' + words.underline.green);
		return;
	}
	console.log(colors.green(words) + '\n');
}

function yellow(words, heading) {
	if (heading) {
		console.log('\n\t\t' + words.underline.yellow);
		return;
	}
	console.log(colors.yellow(words) + '\n');
}

function red(words, heading) {
	if (heading) {
		console.log('\n\t\t' + words.underline.red);
		return;
	}
	console.log(colors.red(words) + '\n');
}

function blue(words, heading) {
	if (heading) {
		console.log('\n\t\t' + words.underline.blue);
		return;
	}
	console.log(colors.blue(words) + '\n');
}

function cyan(words, heading) {
	if (heading) {
		console.log('\n\t\t' + words.underline.cyan);
		return;
	}
	console.log(colors.cyan(words) + '\n');
}

if (process.argv[2]) {
	pandocToPpub(require(`./${process.argv[2]}`));
} else {
	exports.pandocToPpub = pandocToPpub;
}
