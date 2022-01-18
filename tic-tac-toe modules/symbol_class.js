module.exports = class Symbol{
    constructor(symbol_str){
        this.symbol_str = symbol_str;
    }
    return_val = () =>{
        return this.symbol_str;
    }
}