module.exports = class Board{
    constructor(init_sym, sym1, sym2, board_array, board_res, board_stat){
        this.init_sym = init_sym;
        this.board_array = board_array;
        this.sym1 = sym1;
        this.sym2 = sym2;
        this.board_res = board_res;
        this.board_stat = board_stat;
    }
    get_board_as_val = (self) =>{
        return self.board_array.map((sym)=>sym.symbol_str);
    }
    get_empty_pos = (self) => {
        let init_sym_loc = self.init_sym;
        let return_array = [];
        let board_array_to_use = self.board_array;
        for (let i = 0; i < board_array_to_use.length; i++){
            if (board_array_to_use[i].symbol_str == init_sym_loc.symbol_str){
                return_array.push(i);
            }
        }
        return return_array;
    }
    check_for_win = (self) =>{
        let empty_pos = self.get_empty_pos(self);
        let board_as_val = self.get_board_as_val(self);
        let empty_sym_str = self.init_sym.symbol_str;
        let sym1_str = self.sym1.symbol_str;
        let sym2_str = self.sym2.symbol_str;
        function check_for_column(board_as_val_temp, empty_sym_str_temp, sym1_str_temp, sym2_str_temp){
            for (let col_index = 0; col_index < 3; col_index++){
                let sym1_count = 0;
                let sym2_count = 0;
                for (let row_index = 0; row_index < 3; row_index++){
                    let pos_val = board_as_val_temp[col_index + 3*(row_index)]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                if ((sym1_count == 3) || (sym2_count==3)){
                    return true
                } 
            }
            return false
        }
        function check_for_row(board_as_val_temp, empty_sym_str_temp, sym1_str_temp, sym2_str_temp){
            for (let row_index = 0; row_index < 3; row_index++){
                let sym1_count = 0;
                let sym2_count = 0;
                for (let col_index = 0; col_index < 3; col_index++){
                    let pos_val = board_as_val_temp[3*row_index + (col_index)]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                if ((sym1_count == 3) || (sym2_count==3)){
                    return true
                } 
            }
            return false
        }
        function check_for_diag(board_as_val_temp, empty_sym_str_temp, sym1_str_temp, sym2_str_temp){
            for (let diag_index = 0; diag_index < 3; diag_index+=2){
                let sym1_count = 0;
                let sym2_count = 0;
                for (let ran_cnt = 0; ran_cnt < 3; ran_cnt++){
                    let pos_val = board_as_val_temp[diag_index + (ran_cnt*(4-diag_index))]
                    sym1_count += (+(pos_val === sym1_str_temp));
                    sym2_count += (+(pos_val === sym2_str_temp));
                }
                if ((sym1_count == 3) || (sym2_count==3)){
                    
                    return true
                } 
            }
            return false
        }
 
        return (check_for_column(board_as_val, empty_sym_str, sym1_str, sym2_str) || check_for_row(board_as_val, empty_sym_str, sym1_str, sym2_str) || check_for_diag(board_as_val, empty_sym_str, sym1_str, sym2_str));
    }
    make_move = (symbol_, pos_, self) => {
        self.board_array[pos_] = symbol_;
    }
    make_move_copy = (symbol_, pos_, self) => {
        let empty_sym = new Symbol('0');
        let x_sym = new Symbol('x');
        let o_sym = new Symbol('o');
        let board_arr = [];
 
        let board_main = self.board_array;
        for (let index = 0; index < board_main.length; index++){
            if (board_main[index].symbol_str == 'x'){
                board_arr.push(x_sym);
            }
            else if (board_main[index].symbol_str == 'o'){
                board_arr.push(o_sym);
            }
            else{
                board_arr.push(empty_sym);
            }
            
        }
        board_arr[pos_] = symbol_;
        let board_to_return = new Board(empty_sym, x_sym, o_sym, board_arr, 0, 0);
        return board_to_return;
    }
    printBoard=(self)=>{
        alert(self.get_board_as_val(self).toString());
    }
}
