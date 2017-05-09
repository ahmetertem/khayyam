module.exports = {
	toBase64: function(string)
	{
		var buffer = new Buffer(string);
		return buffer.toString('base64');
	},
	toAscii: function(hash)
	{
		var buffer = new Buffer(hash, 'base64');
		return buffer.toString('ascii');
	}
};
