function getScore(board_with_new_move, played_player){
    //board_with_new_move.printBoard(board_with_new_move);
    let empty_pos_on_board = board_with_new_move.get_empty_pos(board_with_new_move);
    if (board_with_new_move.check_for_win(board_with_new_move) == true){
        if (played_player.symbol_str == 'x'){
            return 10;
        }
        else{
            return -10;
        }
    }
    else {
        if (empty_pos_on_board.length == 0){
            return 0;
        }
        else{
            let score_arr = [];
            for (let pos_index = 0; pos_index < empty_pos_on_board.length; pos_index++){
                var sym_to_use;
                if (played_player.symbol_str == 'x'){
                    sym_to_use = new Symbol('o');
                }
                else{
                    sym_to_use = new Symbol('x');
                }
                let score_get = getScore(board_with_new_move.make_move_copy(sym_to_use, empty_pos_on_board[pos_index], board_with_new_move), sym_to_use);
                score_arr.push(score_get);
                //console.log(score_get);
            }
            if (played_player.symbol_str == 'o')
            {
                return Math.max.apply(Math, score_arr);
            }
            else {
                return Math.min.apply(Math, score_arr);
            }
        }
        }
}
function nextMove(board_state){
    let empty_pos_ = board_state.get_empty_pos(board_state);
    console.log(empty_pos_)
    let score_arr_state = []
    let x_sym = board_state.sym1;
    for (let count = 0; count < empty_pos_.length; count++){
        let new_board = board_state.make_move_copy(x_sym, empty_pos_[count], board_state);
        score_arr_state.push(getScore(new_board, x_sym));
       // console.log(getScore(new_board, x_sym));
    }
    let max_ = Math.max.apply(Math, score_arr_state);
    for (let count2 = 0; count2 < empty_pos_.length; count2++){
        if (score_arr_state[count2] == max_){
            return empty_pos_[count2]
        }
    }
}        
function userMove(index, current_board, o_sym, x_sym){
    let current_board_arr = current_board.board_array;
    let element_ = current_board_arr[index];
    if (element_.return_val() == '0' && current_board.board_res == 0){
        current_board.make_move(o_sym, index, current_board);
    document.getElementById(`but${index}`).childNodes[0].innerHTML = 'O';
    
    setTimeout(()=>{if (current_board.check_for_win(current_board) == true){
        current_board.board_stat = 1;
    }
    else{
        if (current_board.get_empty_pos(current_board).length == 0){
            current_board.board_stat = 2;
        }
        else{
            move_comp = nextMove(current_board);
            current_board.make_move(x_sym, move_comp, current_board);
            document.getElementById(`but${move_comp}`).childNodes[0].innerHTML = 'X';
            if (current_board.check_for_win(current_board) == true){
                current_board.board_stat = 3;
                
            }
            else{
                if (current_board.get_empty_pos(current_board).length == 0){
                    current_board.board_stat = 2;
                }
            }
        }
    }}, 300)
}
}

module.export = {getScore, nextMove, userMove};