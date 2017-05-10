module.exports = market;

function market(api_key, api_secret)
{
	this.api_key = api_key;
	this.api_secret = api_secret;
	// private pairs for reading json (not implemented yet)
	this._pairs = [];
	this.pairs = [];
	this.balances_in_pockets = [];
	this.balances_on_orders = [];
	this.balances_all = [];
	this._nonce = Math.floor(Date.now() / 1000);
	this.get_nonce = function()
	{
		this._nonce++;
		return this._nonce;
	}
}
