var write = require('fs-writefile-promise');
var colors = require('colors');
var fs = require('fs');
var execPromise = require('child-process-promise').exec;
var requestPromise = require('request-promise');

/*
 * @options { bibFile }
 *
 */
function pubToPandoc(docJSON, options) {

	var currentDocJSONNodeParents = []; // stack for keeping track of the last node : )
	var currentPandocNodeParents = []; // stack for keeping track of the last output node
	var blocks = []; // blocks (pandoc AST) is eventually set to this array.
	var pandocJSON = {};
	var inTable = false;
	var col; // used when within a table, to keep track of current pandoc col
	var row; // used when within a table, to keep track of current pandoc row
	// var docJSON = obj;
	var itemCountBib = 1;
	var bibFile = (options && options.bibFile) ?  options.bibFile : Math.random().toString(36).substring(7)  + '.bib';
	var refItemNumber = 1;
	var listDepthStack = []; // A stack for keeping track of which node on a list we are on
	var bibContents = '';

	console.log(colors.cyan('Starting conversion\n'));

	function isLeafNode(node) {
		if (node.t === 'Str' || node.t === 'Space' || node.t === 'Cite') {
			return true;
		}
		return false;
	}

	/* Pandoc has a Str node for each word and space, this function converts
	* strings to Pandocs format
	*/
	function createTextNodes(str) {

		var newNodes = [];
		// str = str.trim(); // No longer trim, but might be necessary to protect from bugs, the reason I don't is when there is a Link or another thing, followed by text it'll get rid of the leading space
		str = str.split(' ');

		// if (str[0] === '') newNodes.push({ t: 'Space' }); // if first node is a space
		for (var i = 0; i < str.length; i++) {
			// if (str[i] === '') continue;

			newNodes.push({ t: 'Str', c: str[i] });
			if (i < str.length - 1) {
				newNodes.push({ t: 'Space' });
			}
		}
		return newNodes;
	}


	// Create a node
	// If node is a root node, push it to blocks array
	function scan(node) {
		// green(`\nBlocks:\t${JSON.stringify(blocks)}\nParentNodes:\t${JSON.stringify(currentDocJSONNodeParents)}\nOutputParentNodes:\t${JSON.stringify(currentPandocNodeParents)}\n`)
		var newNode = { t: undefined, c: [] };
		var newerNodes = []; // Used primarily for strong, emphasis, link, code text
		var markCount = 0; // Used to count strong, emphasis, link, code text, the reason being that you can have newer nodes that aren't marks

		switch (node.type) {
			case 'block_embed': // Cases: Image in table
				newNode.t = 'Image';
				newNode.c[0] = ['', [], []];
				newNode.c[1] = [];
				newNode.c[2] = [node.attrs.data.content.url, ''];
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
			case 'paragraph':
				// Let's actually create Paragraph nodes when text nodes are seen, as opposed to when paragraph nodes are seen
				if (currentDocJSONNodeParents[currentDocJSONNodeParents.length - 1].type === 'list_item') {
					red('PARENT IS LIST ITEM');
					newNode.t = 'Plain';
					break;
				} else if (inTable && currentPandocNodeParents[currentPandocNodeParents.length-1].t === 'Plain' && currentPandocNodeParents[currentPandocNodeParents.length-2].t === 'Table') {
					newNode.t = 'DoNotAddThisNode';
				} else {
					// This is the proper way to handle Para -- one to one with docJSOn paragraph
					// Because otherwise have issues with Para : [text, text]
					newNode.t = 'Para';
				}

				break;
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
				var parent = currentPandocNodeParents[currentPandocNodeParents.length - 1];
				if (parent.t === 'OrderedList'){
					parent.c[1][depth] = [];
				} else {
					parent.c[depth] = [];
				}
				console.log("new list depth stack " + listDepthStack)
				break;
			case 'table':
				inTable = true;
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

				newNode.t = "DoNotAddThisNode";

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

			// red("Hit a citation. Unimplemented..", true)
			// newNode.t = "Note";
			// var content;
			// console.log(JSON.stringify(node))
			//
			// if (node.content[0].attrs.caption)
			// 	content = createTextNodes(node.attrs.caption);
			// }
			// newNode.c[0] = { t: "Para", c: false ? createTextNodes() : []}

				break;

				// Crete a Para parent
				// newNode.t = "Para";
				// var childNode = {};
				// newNode.c[0] = childNode;
				// childNode.t = "Cite";
				// childNode.c =[{
				// 	{
				// 		 citationSuffix:[
				//
				// 		 ],
				// 		 citationNoteNum:0,
				// 		 citationMode:{
				// 				t:"AuthorInText"
				// 		 },
				// 		 citationPrefix:[
				//
				// 		 ],
				// 		 citationId:"Book",
				// 		 citationHash:0
				// 	}
				// }, [
				// 	{
				// 		t: "Str",
				// 		c: "@Book" //May not necessarily be book
				// 	}
				// ]]
				// childNode.c[2] =


				// Footers stuf fis copy pasted below. This is untested and copy pasted.
				// red("Hit a citation. Unimplemented..", true)
				// newNode.t = "Note";
				// var content;
				// console.log(JSON.stringify(node))
				//
				// if (node.content[0].attrs.caption)
				// 	content = createTextNodes(node.attrs.caption);
				// }
				// newNode.c[0] = { t: "Para", c: false ? createTextNodes() : []}
			case 'citation':
				var author = node.attrs.data.author;
				var title = node.attrs.data.title;
				var journal = node.attrs.data.journal;
				var year = node.attrs.data.year;
				var citationString = `${author}. ${year}. ${title}. ${journal}`

				// Going to try to insert this into the .bib file
				// newNode.t = 'Div';
				//
		//
				// newNode.c = [
				// 	['ref-item' + refItemNumber++, [], []],
				// 	[{ t: 'Para', c: createTextNodes(citationString) }]
				// ];
				newNode.t = "DoNotAddThisNode";

				var str = `
					@article{item${itemCountBib++},
						author = {"${author}"},
						journal = {"${journal}"},
						year = {"${year}"},
						title = {"${title}"}
					}
					`;
					// Append this reference to the .bib file

				bibContents += str;
					// execPromise(`echo "${str}" >> ${bibFile}`);

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
				red(`Uh oh...Unprocessed node of type ${node.type}`);
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
				var parent = currentPandocNodeParents[currentPandocNodeParents.length-1];
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

		if (node.type === 'paragraph' || node.type === 'heading'
		|| node.type === 'horizontal_rule' || node.type === 'blockquote'
		|| node.type === 'bullet_list' || node.type === 'ordered_list'
		|| node.type === 'list_item' || node.type === 'table'
		|| node.type === 'table_row' || node.type === 'table_cell'
		|| node.type === 'block_embed' || node.type === 'text'
		|| node.type === 'embed' || node.type === 'latex'
		|| node.type === 'reference' || node.type === 'citation'
		|| node.type === 'citations') {
			currentDocJSONNodeParents.pop();
		}
		if (newNode.t === 'Para' || newNode.t === 'Plain'
		|| newNode.t === 'Header' || newNode.t === 'Code'
		|| newNode.t === 'HorizontalRule' || newNode.t === 'BlockQuote'
		|| newNode.t === 'BulletList' || newNode.t === 'OrderedList'
		|| newNode.t === 'Table' || newNode.t === 'Image'
		|| newNode.t === 'Note' || newNode.t === 'Link'
		|| newNode.t === 'Superscript') {
			// Link is for the case UL->[Link, Str]
			blue(`Popping 1 - ${JSON.stringify(newNode.t)}`);
			currentPandocNodeParents.pop();
		} else if (inTable) {
			if (newNode.t === 'Plain') {
				blue(`Popping 2 - ${JSON.stringify(newNode.t)}`);
				currentPandocNodeParents.pop();
			}
		}

		while (markCount > 0) {
			blue('Popping mark');
			markCount--;
			currentPandocNodeParents.pop();
		}

		if (node.type === 'table') {
			inTable = false;
		}

		if (node.type === 'bullet_list' || node.type === 'ordered_list') {
			listDepthStack.pop();
		}
	}

	// Link a node to a parent node, or make it a parent
	function addNode(newNode) {
		var parent = currentPandocNodeParents[currentPandocNodeParents.length - 1];

		if (newNode.t === 'DoNotAddThisNode') {
			return;
		}

		if (!parent) {
			green(`Pushing to root ${JSON.stringify(newNode)}`);
			currentPandocNodeParents.push(newNode);
			blocks.push(newNode);
			return;
		}

		switch (parent.t) {
			case 'Table':
				console.log(`pushing to ${row}, ${col}`);
				if (row < 1) {
					// parent.c[3].push([newNode]) // c3 is for header data.
					if (!parent.c[3][col]) {
						parent.c[3][col] = [];
					}
					console.log(`inserting at c[3][${col}]`);
					parent.c[3][col].push(newNode);
				} else {
					if (!parent.c[4][row - 1]) {
						parent.c[4][row - 1] = [];
					}
					if (!parent.c[4][row - 1][col]) {
						parent.c[4][row - 1][col] = [];
					}
					console.log(`inserting at c[4][${(row - 1)}][${col}]`);

					parent.c[4][row - 1][col].push(newNode);
				}
				green(`pushing ${JSON.stringify(newNode)}`);
				currentPandocNodeParents.push(newNode);
				break;
			case 'Link':
			case 'Code':
			case 'Strikeout':
				parent.c[1].push(newNode);
				green(`SWEH: pushing ${JSON.stringify(newNode)}`);
				isLeafNode(newNode) ? undefined : currentPandocNodeParents.push(newNode);
				break;
			case 'BulletList':
				var depth = listDepthStack[listDepthStack.length - 1];
				if (depth === -1) {
					depth = listDepthStack[listDepthStack.length - 2];
				}
				parent.c[depth].push(newNode);

				green(`pushing5 ${JSON.stringify(newNode)}`);
				currentPandocNodeParents.push(newNode); // Ahh may be buggy

				break;
			case 'OrderedList':
				var depth = listDepthStack[listDepthStack.length - 1];
				if (depth === -1) {
					depth = listDepthStack[listDepthStack.length - 2];

				}
				console.log(listDepthStack)
				console.log(`pushing a ${newNode.t} at c[1][${depth}]`)
				console.log(JSON.stringify(parent))

				parent.c[1][depth].push(newNode);

				green(`pushing6 ${JSON.stringify(newNode)}`);
				currentPandocNodeParents.push(newNode); // Ahh may be buggy
				break;
			case 'CodeBlock':
			case 'Math':
				// Don't do anything
				break;
			case 'Cite':
				red("PARENT IS CITE SHOULD NEVER HAPPEN LOL")
				parent.c.push(newNode);
				break;
			case 'BlockQuote':
			case 'Para':
			case 'Emph':
			case 'Strong':
			case 'Plain':
				console.log('HZX: ' + JSON.stringify(newNode));
				parent.c.push(newNode);
				if ((parent.t !== 'Para' && parent.t !== 'Plain') || (parent.t === 'Plain' && inTable)) {
					isLeafNode(newNode) ? undefined : currentPandocNodeParents.push(newNode);
				} else if (parent.t === 'Emph' || parent.t === 'Strong') {
					green(`pushing3: ${JSON.stringify(newNode)}`);
					currentPandocNodeParents.push(newNode);
				} else if (parent.t === 'Para' || parent.t === 'Plain') {
					// Wasn't doing this to Plain before, not sure why.
					isLeafNode(newNode) ? undefined : currentPandocNodeParents.push(newNode);
				} else if (parent.t === 'Note') {
					blue('pushing Note');
					currentPandocNodeParents.push(newNode);
				}
				break;
			case 'Note':
				parent.c.push(newNode);
				currentPandocNodeParents.push(newNode);
				break;
			case 'Div':
				parent.c[1].push(newNode);
				break;
			default:
				red('Reached Default on: ' + JSON.stringify(newNode))
				parent.c[2].push(newNode);
				break;
		}

	}

	function scanFragment(fragment) {
		currentDocJSONNodeParents.push(fragment);
		if (fragment.content) {
			fragment.content.forEach((child, offset) => scan(child));
		}
	}

	/* Write the file, and convert it back to make sure it was successful :D
	*********************************************************************
	*********************************************************************/

	function finish(fl) {
		if (blocks.length === 0) {
			throw new Error('Conversion failed');
		}

		// write file syncronously
		// fs.writeFileSync(bibFile, bibContents);
		return write(bibFile, bibContents)
		.then(function() {
			pandocJSON.blocks = blocks;
			pandocJSON['pandoc-api-version'] = [
				1,
				17,
				0,
				4
			];
			pandocJSON.meta = {
				author: {
					t: 'MetaList',
					c: [
						{
							t: 'MetaInlines',
							c: [
								{
									t: 'Str',
									c: 'Lucien'
								},
								{
									t: 'Space'
								},
								{
									t: 'Str',
									c: 'William'
								}
							]
						}
					]
				},
				title: {
					t: 'MetaInlines',
					c: [
						{
							t: 'Str',
							c: 'An'
						},
						{
							t: 'Space'
						},
						{
							t: 'Str',
							c: 'Optimizing'
						}
					]
				}
			};

			return requestPromise('https://gist.githubusercontent.com/hassanshaikley/3919ecf56ec915cffc1ac573fa3fdc50/raw/3a5a022109ca356c82d1f918dead73fc811c5cdd/metadata.json');
		})
		.then(function(htmlContent) {
			var metadata = JSON.parse(htmlContent);
			if(metadata.body['degree']) {
				pandocJSON.meta.pubdegree = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['degree'])
				};
			}
			if(metadata.body['university']) {
				pandocJSON.meta.pubuniversity = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['university'])
				};
			}
			if(metadata.body['date']) {
				pandocJSON.meta.pubdate = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['date'])
				};
			}
			if(metadata.body['supervisor-name']) {
				pandocJSON.meta.pubsupervisorname = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['supervisor-name'])
				};
			}
			if(metadata.body['supervisor-title']) {
				pandocJSON.meta.pubsupervisortitle = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['supervisor-title'])
				};
			}
			if(metadata.body['department-chairman-name']) {
				pandocJSON.meta.pubchairmanname = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['department-chairman-name'])
				};
			}
			if(metadata.body['department-chairmain-title']) {
				pandocJSON.meta.pubchairmantitle = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['department-chairmain-title'])
				};
			}
			if(metadata.body['acknowledgements']) {
				pandocJSON.meta.pubacknowledgements = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['acknowledgements'])
				};
			}
			if(metadata.body['abstract']) {
				pandocJSON.meta.pubabstract = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['abstract'])
				};
			}
			if(metadata.body['degree-month']) {
				pandocJSON.meta.pubdegreemonth = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['degree-month'])
				};
			}
			if(metadata.body['degree-year']) {
				pandocJSON.meta.pubdegreeyear = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['degree-year'])
				};
			}
			if(metadata.body['thesis-date']) {
				pandocJSON.meta.pubthesisdate = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['thesis-date'])
				};
			}
			if(metadata.body['department']) {
				pandocJSON.meta.pubdepartment = {
					t: 'MetaInlines',
					c: createTextNodes(metadata.body['department'])
				};
			}
			// metadata.body['university'];
			// metadata.body['supervisor-name'];
			// metadata.body['supervisor-title'];
			// metadata.body['chairman-name'];
			// metadata.body['chairman-title'];
			// metadata.body['abstract'];
			// metadata.body['acknowledgements'];
			console.log(JSON.stringify(pandocJSON))
			return pandocJSON;
		})
		.catch(function(error) {
			console.log(error)
		})
	}

	scanFragment(docJSON, 0);

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

// Allow command line args `node index fileToConvert.json`
if (process.argv[2]) {
	pubToPandoc(require(`./${process.argv[2]}`));
} else {
	exports.pubToPandoc = pubToPandoc;
}
