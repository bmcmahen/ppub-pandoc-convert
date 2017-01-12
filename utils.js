exports.isLeafNode = function isLeafNode(node) {
	if (node.t === 'Str' || node.t === 'Space') {
		return true;
	}
	return false;
};

/* Pandoc has a Str node for each word and space, this function converts
* strings to Pandocs format
*/
exports.createTextNodes = function createTextNodes(str) {

	var newNodes = [];
	// str = str.trim(); // No longer trim, but might be necessary to protect from bugs, the reason I don't is when there is a Link or another thing, followed by text it'll get rid of the leading space
	str = str.split(' ');
	console.log(str);
	for (var i = 0; i < str.length; i++) {
		// if (str[i] == "") continue;

		newNodes.push({ t: 'Str', c: str[i] });
		if (i < str.length - 1) {
			newNodes.push({ t: 'Space' });
		}
	}
	return newNodes;
}
