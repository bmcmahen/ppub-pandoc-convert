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

function handleInline(element) {
	console.log(colors.blue('handleInline ' + JSON.stringify(element)))
	switch (element.t) {
		case 'Str':
			// Handle string!!
			break;
		case 'Emph':
		case 'Strong':
		case 'Strikeout':
		case 'Superscript':
		case 'Subscript':
		case 'SmallCaps':
			// Handle the creation of the above types
			// c[0] is an inline element
			break;
		case 'Quoted':
		case 'Cite':
			break;
		default:
			break;
	}
}

function traversePandoc(elements) {
	console.log('Traversing Array: ' + JSON.stringify(elements))
	for (let i = 0; i < elements.length; i++) {
		if (isBlock(elements[i].t)) {
			console.log('hit elements type ' + elements[i].t)
			switch (elements[i].t) {
				case 'Plain':
				case 'Para':
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

function startTraversePandoc(pandoc){
	traversePandoc(pandoc.blocks)
}

if (process.argv[2]) {
	startTraversePandoc(require(`./${process.argv[2]}`));
} else {
	exports.ppubToPandoc = startTraversePandoc;
}
