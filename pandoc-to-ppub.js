var colors = require('colors')

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


function startTraversePandoc(pandoc) {

	var ppub = {
		type: 'doc',
		content: [
			//first is article second is
			//citations
		]
	};

	// This variable is used to keep track of parent nodes
	// Usually for inserting new nodes
	var ppubNodeParents = [{
		type: 'article',
		content: []
	}];

	function traversePandoc(elements) {
		console.log('Traversing Array: ' + JSON.stringify(elements));
		for (let i = 0; i < elements.length; i++) {
			var currentPpubParent = ppubNodeParents[ppubNodeParents.length - 1];
			console.log('currentppub parent is ' + JSON.stringify(currentPpubParent));
			if (isBlock(elements[i].t)) {
				console.log('hit elements type ' + elements[i].t)
				switch (elements[i].t) {
					case 'Plain':
					case 'Para':
						//Create a Para Node
						var newNode = { type: 'paragraph', content: [] };
						ppubNodeParents.push(newNode)
						currentPpubParent.content.push(newNode);
						handleInline(elements[i].c);
						ppubNodeParents.pop();
						// traversePandoc(elements[i].c[0])
						break;
					case 'LineBlock':
						handleInline(elements[i].c[0][0]);
						break;
					case 'CodeBlock':
					case 'RawBlock':
						// BUILD THE ELEMENT c[1] is the string
					case 'BlockQuote':
						traversePandoc(elements[i].c[0])
						break;
					case 'OrderedList':
						traversePandoc(elements[i].c[1][0])
						break;
					case 'Header':
						var newNode = { type: 'heading', attrs: { level: elements[i].c[0] }, content: [] };
						addNode(newNode);
						ppubNodeParents.push(newNode);
						handleInline(elements[i].c[2]);
						ppubNodeParents.pop();
						break;
					case 'HorizontalRule':
						//BUILD THE ELEMENT HERE
					case 'Table':
						// Ehh this is too complicated to implement off the cuff
					case 'Div':
						traversePandoc(elements[i].c[1])
						break;
					default:
						break;
				}

				console.log(colors.cyan('Reached block node ' + JSON.stringify(elements[i])));
			} else if (isInline(elements[i].t)) {
				console.log(colors.yellow('Reached leaf node ' + JSON.stringify(elements[i])));
				// handleInline(elements[i]);

			} else {
				console.log(colors.red('Unknown ' + JSON.stringify(elements[i])))
			}
		}
		console.log('\n\n\n')
		console.log(colors.yellow(JSON.stringify(ppubNodeParents)))
		console.log(colors.cyan(JSON.stringify(ppubNodeParents[0], null, '\t')))
		console.log('\n')

		return ppubNodeParents[0];
	}

	function addNode(newNode) {
		// Not convinced this is optimal
		var currentPpubParent = ppubNodeParents[ppubNodeParents.length - 1];
		currentPpubParent.content.push(newNode);
	}

	function handleMark(element) {
		var currentPpubParent = ppubNodeParents[ppubNodeParents.length - 1];
		console.log("Adding mark " + JSON.stringify(element))
		if (!currentPpubParent.marks) {
			currentPpubParent.marks = [];
		}
		var newMark;
		switch (element.t) {
			case 'Code':
				newMark = 'code';
				currentPpubParent.content.push(element.c[1]);
				break;
			case 'Subscript':
				newMark = 'sub';
				break;
			case 'Superscript':
				newMark = 'sup';
				break;
			case 'Emph':
				newMark = 'em';
				break;
			case 'Strong':
				newMark = 'strong';
				break;
			case 'Strikeout':
				newMark = 'strike';
				break;
			default:
				console.log(colors.red("Mark of type " + element.t  + " not found"))
				break;
		}

		currentPpubParent.marks.push({ type: newMark });

	}

	function handleStr(element) {
		var currentPpubParent = ppubNodeParents[ppubNodeParents.length - 1];
		var lastContentItem = currentPpubParent.content[currentPpubParent.content.length - 1];

		console.log(`current ppub parent: ${JSON.stringify(currentPpubParent)}`)
		console.log(`last content item: ${JSON.stringify(lastContentItem)}`)
		console.log(`element is ${JSON.stringify(element)}`)

		if (!lastContentItem) {
			newNode = { type: 'text', text: '' };
			addNode(newNode);
			lastContentItem = newNode;
		}

		if (element.t === 'Space') {
			lastContentItem.text = lastContentItem.text.concat(' ');
		} else {
			lastContentItem.text = lastContentItem.text.concat(element.c);
		}
	}

	function handleInline(elements) {
		console.log(colors.blue('handleInline ' + JSON.stringify(elements)))
		for (var i = 0; i < elements.length; i++) {
			switch (elements[i].t) {
				case 'Space':
				case 'Str':
					handleStr(elements[i])
					console.log('Hit String')
					break;
				case 'Emph':
				case 'Strong':
				case 'Strikeout':
				case 'Superscript':
				case 'Subscript':
				case 'SmallCaps':
				case 'Code':
					handleMark(elements[i]);

					handleInline(elements[i].c)
					// Handle the creation of the above types
					// c[0] is an inline elements
					break;
				case 'Quoted':
				case 'Cite':
					break;
				default:
					break;
			}
		}
	}


	traversePandoc(pandoc.blocks);
}

if (process.argv[2]) {
	startTraversePandoc(require(`./${process.argv[2]}`));
} else {
	exports.pandocToPpub = startTraversePandoc;
}
