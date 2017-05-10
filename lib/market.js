module.exports = marketa;

function marketa(api_key, api_secret)
{
    this.api_key = api_key;
    this.api_secret = api_secret;
    // private pairs for reading json
    this._pairs = [];
    this.pairs = [];
    this.balances_in_pockets = [];
    this.balances_on_orders = [];
    this.balances_all = [];
    this._nonce = -1;
    this.get_nonce = function()
    {
        if (this._nonce == -1)
        {
            this._nonce = Math.floor(Date.now() / 1000);
        }
        else
        {
            this._nonce++;
        }
        return this._nonce;
    }
}
