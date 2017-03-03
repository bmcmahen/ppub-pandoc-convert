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

	var currentPpubNodeParents = [{
		type: 'Article',
		content: []
	}];

	function traversePandoc(elements) {
		console.log('Traversing Array: ' + JSON.stringify(elements))
		for (let i = 0; i < elements.length; i++) {
			var currentPpubParent = currentPpubNodeParents[currentPpubNodeParents.length -1];
			if (isBlock(elements[i].t)) {
				console.log('hit elements type ' + elements[i].t)
				switch (elements[i].t) {
					case 'Plain':
					case 'Para':
						//Create a Para Node
						currentPpubParent.push({t: 'paragraph', c: [] });
						handleInline(elements[i].c);
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
						handleInline(elements[i].c[2]);
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
	}

	function addNode(newNode) {
		// Not convinced this is optimal
		var currentPpubParent = currentPpubNodeParents[currentPpubNodeParents.length - 1];

	}

	function handleString(element) {
		var currentPpubParent = currentPpubNodeParents[currentPpubNodeParents.length - 1];
		var lastContentItem = currentPpubParent.content[currentPpubParent.content.length - 1];
		if (!lastContentItem) {
			newNode = { type: 'text', text: '' };
			addNode(newNode);
			lastContentItem = newNode;
		}

		if (element.t === 'Space') {
			lastContentItem.text.concat(' ');
		} else {
			lastContentItem.text.concat(element.c);
		}
	}

	function handleInline(elements) {
		console.log(colors.blue('handleInline ' + JSON.stringify(elements)))
		for (var i = 0; i < elements.length; i++) {
			switch (elements[i].t) {
				case 'Str':
					handleString(elements[i])
					console.log('Hit String')
					break;
				case 'Emph':
				case 'Strong':
				case 'Strikeout':
				case 'Superscript':
				case 'Subscript':
				case 'SmallCaps':
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


	traversePandoc(pandoc.blocks)
}

if (process.argv[2]) {
	startTraversePandoc(require(`./${process.argv[2]}`));
} else {
	exports.ppubToPandoc = startTraversePandoc;
}
