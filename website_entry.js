const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const path = require('path');
const http = require("http");
const app = express();
var server=app.listen(process.env.PORT || 2000, ()=>{console.log("Listening.....")});
const socket = require("socket.io");
const io = socket(server);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views','./public/views');
//Time:
const moment = require('moment')
//var io = socketio(server)

require('./config/passport')(passport)
//Mongoose:
const db = "mongodb+srv://vinayakjha1234:9313191625qazqaz@cluster0.ds07w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose.connect(db, { useNewUrlParser: true })
    .then(()=>console.log("Mongoose Connected"))
    .catch((err)=>console.log(err));
//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error');
    next();
})
app.use('/', require('./public/routes/index'))
app.use('/users', require('./public/routes/users'))

//Utility Classes:
class active_game{
    constructor(player1, player2, player1_user_id, player2_user_id, room_name){
        this.player1 = player1;
        this.player1_user_id = player1_user_id;
        this.player2_user_id = player2_user_id;
        this.player2 = player2;
        this.board_state = undefined;
        this.room_name = room_name;
        this.current_player = 1;
        this.current_result = 0; // 0 for nothing, 'P1 for player1 wins', P2 for player2 wins', 'D for a draw'
        this.isWithComp = false;
        this.last_obj;
    }
}
function getUnique(input_arr){
    index_ = Math.floor(Math.random()*input_arr.length);
    return input_arr[index_]
}
Array.prototype.sample = function(){
    return this[Math.floor(Math.random()*this.length)];
  }

//Board Modules
//const {getScore, nextMove, userMove} = require('./tic-tac-toe modules/misc_functions');
// Utility Function Definitions:
function getScore(board_with_new_move, played_player, comp_sym){
    //board_with_new_move.printBoard(board_with_new_move);
    let empty_pos_on_board = board_with_new_move.get_empty_pos(board_with_new_move);
    if (board_with_new_move.check_for_win(board_with_new_move) == true){
        if (played_player.symbol_str == comp_sym.symbol_str){
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
                let score_get = getScore(board_with_new_move.make_move_copy(sym_to_use, empty_pos_on_board[pos_index], board_with_new_move), sym_to_use, comp_sym);
                score_arr.push(score_get);
            }
            if (played_player.symbol_str !== comp_sym.symbol_str)
            {
                return Math.max.apply(Math, score_arr);
            }
            else {
                return Math.min.apply(Math, score_arr);
            }
        }
        }
}
function nextMove(board_state, comp_sym){
    let empty_pos_ = board_state.get_empty_pos(board_state);
    let score_arr_state = []
    let x_sym = board_state.sym1;
    for (let count = 0; count < empty_pos_.length; count++){
        let new_board = board_state.make_move_copy(comp_sym, empty_pos_[count], board_state);
        score_arr_state.push(getScore(new_board, comp_sym, comp_sym));
    }
    let max_ = Math.max.apply(Math, score_arr_state);
    for (let count2 = 0; count2 < empty_pos_.length; count2++){
        if (score_arr_state[count2] == max_){
            return empty_pos_[count2]
        }
    }
}   

class Board{
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
    get_which_win=(self)=>{
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
                        return `col-${col_index}`;
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
                        return `row-${row_index}`;
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
                        return `diag-${diag_index}`;
                    } 
                }
                return false
            }
     
            return (check_for_column(board_as_val, empty_sym_str, sym1_str, sym2_str) || check_for_row(board_as_val, empty_sym_str, sym1_str, sym2_str) || check_for_diag(board_as_val, empty_sym_str, sym1_str, sym2_str));
    }
}

class Symbol{
    constructor(symbol_str){
        this.symbol_str = symbol_str;
    }
    return_val = () =>{
        return this.symbol_str;
    }
}
class online_user{
    constructor(online_user_id){
        this.online_user_id = online_user_id;
        this.your_feed_index = 0;
        this.your_posts_index = 0;
        this.liked_posts_index = 0;
    }
}
const x_sym = new Symbol('x');
const o_sym = new Symbol('o');
const empty_sym = new Symbol('0');

//Socket Commands:
const User = require('./models/User');
const { timeLog } = require('console');
const req = require('express/lib/request');
const { post } = require('./public/routes/index');
let online_users = [];
let socket_id_dict = {};
let players_rooms = [];
let active_games = [];
let active_players = new Set([]);
let socket_id_dict_players = {};
let dm_connect_request = [];
io.on('connection', socket=>{
    console.log('New WS Connection');
    socket.on('makeUserOnline', (userId)=>{
        User.findByIdAndUpdate(userId, {onlineState: 'true'}, (err, docs)=>{
            if (err) { console.log(err);
            }else{
                let temp_user = new online_user(userId);
                online_users.push(temp_user);
                socket_id_dict[socket.id] = userId;
            }
        })});
    socket.on('disconnect', ()=>{
            User.findByIdAndUpdate(socket_id_dict[socket.id], {onlineState: 'false'}, (err, docs)=>{
                if (err) { console.log(err);
                }else{
                    if (docs){
                    let index_of_user = online_users.findIndex((elem) => {elem.online_user_id === socket_id_dict[socket.id]})
                    online_users.splice(index_of_user);
                    let name_ = docs.name;
                    let room_name_pos = `${docs._id}--|--${docs.name}`;
                    if (players_rooms.includes(room_name_pos)){
                        let index_in_pr = players_rooms.indexOf(room_name_pos);
                        players_rooms.splice(index_in_pr);
                    }
                }
                }
            })
            let user_disconnected = socket_id_dict_players[socket.id];
            
            for (let temp_counter_2  = 0; temp_counter_2 < active_games.length; temp_counter_2++){
                let temp_pl_1_id = active_games[temp_counter_2].player1_user_id;
                let temp_pl_1_name = active_games[temp_counter_2].player1;
                let temp_pl_2_name = active_games[temp_counter_2].player2;
                let temp_pl_2_id = active_games[temp_counter_2].player2_user_id;
                let current_player = active_games[temp_counter_2].current_player;
                if ((temp_pl_1_id === user_disconnected) || (temp_pl_2_id === user_disconnected)){
                    if (active_games[temp_counter_2].current_result === 0){
                            if ((temp_pl_1_id === user_disconnected)){
                                active_games[temp_counter_2].current_result = 'P2';
                                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 0);
                            }else{
                                active_games[temp_counter_2].current_result = 'P1';
                                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 0);
                                
                            }
                            io.to(active_games[temp_counter_2].room_name).emit('dis-result','0');
                            io.socketsLeave(active_games[temp_counter_2].room_name);
                            active_games.splice(temp_counter_2);
                            active_players.delete(temp_pl_1_id);
                            active_players.delete(temp_pl_2_id);
                            
                            
                        }
                    else{
                        io.to(active_games[temp_counter_2].room_name).emit('other-dis','0');
                        io.socketsLeave(active_games[temp_counter_2].room_name);
                        active_games.splice(temp_counter_2);
                            active_players.delete(temp_pl_1_id);
                            active_players.delete(temp_pl_2_id);
                            
                }
                }
            }
        });
        
    socket.on('connect_with_someone', (user)=>{
        setTimeout(()=>{},Math.floor(Math.random()*3000));
        socket_id_dict_players[socket.id] = user.user_id;
        if (players_rooms.length === 0){
            players_rooms.push(`${user.user_id}--|--${user.user_name}`);
            socket.join(`${user.user_id}`);
            }
            else{
            if (players_rooms.includes(`${user.user_id}--|--${user.user_name}`)){
                socket.emit('msg', "Please wait for a connection");
            }else{
                let room_to_join = players_rooms[0];
                players_rooms.splice([0]);
                let other_player_name = room_to_join.split('--|--')[1];
                let my_name = user.user_name;
                let room_num =  room_to_join.split('--|--')[0];
                socket.join(`${room_num}`);
                let player1 = other_player_name;
                let player2 = my_name;
                io.to(room_num).emit('multi-player-connect', `${player1}---|---${player2}---|---${room_num}---|---${user.user_id}`);
                active_players = new Set([...active_players, user.user_id, room_num]);

                let active_game_instance = new active_game(player1, player2, room_num, user.user_id, room_num);
                let new_board_state = new Board(empty_sym, x_sym, o_sym, [empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym]);
                active_game_instance.board_state = new_board_state;
                let temp_obj_t = {
                    'current_turn': 1,
                    'but-enable': true,
                    'but_1': '',
                    'but_2': '',
                    'but_3': '',
                    'but_4': '',
                    'but_5': '',
                    'but_6': '',
                    'but_7': '',
                    'but_8': '',
                    'but_9': '',
                    'msg': 'You can chat here!'
                }
                io.to(room_num).emit('web-render-msg', temp_obj_t)
                active_game_instance.last_obj = JSON.parse(JSON.stringify(temp_obj_t));
                active_games.push(active_game_instance);
            }
        }
        
    })
    socket.on('remove-from-connect-line', (user_info)=>{
        let index_in_player_rooms = players_rooms.indexOf(`${user_info.user_id}--|--${user_info.user_name}`);
        players_rooms.splice(index_in_player_rooms);
    })
    function make_move_render(room_number, game_active, current_board, move_sym, move_index, current_turn_){
        current_board.make_move(move_sym, move_index, current_board);
        let current_turn = current_turn_;
        game_active.current_player = current_turn;
        let temp_board_state = current_board.get_board_as_val(current_board);
        let init_obj = {
        'current_turn': current_turn,
        'but_1': '',
        'but_2': '',
        'but_3': '',
        'but_4': '',
        'but_5': '',
        'but_6': '',
        'but_7': '',
        'but_8': '',
        'but_9': '',
        'msg': ''}
        for (let temp_counter = 0; temp_counter < 9; temp_counter++){
            if (temp_board_state[temp_counter] === '0'){
                init_obj[`but_${temp_counter+1}`] = '';
            }else if(temp_board_state[temp_counter] === 'x'){
                init_obj[`but_${temp_counter+1}`] = 'X';
            }else{
                init_obj[`but_${temp_counter+1}`] = 'O';
            }
            
    }
    io.to(room_number).emit('web-render-msg', init_obj)
    game_active.last_obj = JSON.parse(JSON.stringify(init_obj));
    let isWin = current_board.check_for_win(current_board);
    let empty_pos = current_board.get_empty_pos(current_board);
    let temp_pl_1_id = game_active.player1_user_id;
    let temp_pl_2_id = game_active.player2_user_id;
    let temp_pl_1_name = game_active.player1;
    let temp_pl_2_name = game_active.player2;
    if (isWin){
        if (current_turn === 2){
            io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)})
            game_active.current_result = 'P1';
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 0);
        }else{
            io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)})
            game_active.current_result = 'P2';
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 0);
    }

    }else{
        if(empty_pos.length === 0){
            io.to(room_number).emit('result_here', {result: 'D', string: "none"})
            game_active.current_result = 'D';
            User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                if(err){
                    console.log(err);
                }
            })
            updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 0);

        }
    }
    }
    function comp_make_move_render(room_number, game_active, current_board, move_sym, move_index, current_turn_, comp_sym){
        current_board.make_move(move_sym, move_index, current_board);
        let current_turn = current_turn_;
        game_active.current_player = current_turn;
        let temp_board_state = current_board.get_board_as_val(current_board);
        let init_obj = {
        'current_turn': game_active.current_player,
        'but_1': '',
        'but_2': '',
        'but_3': '',
        'but_4': '',
        'but_5': '',
        'but_6': '',
        'but_7': '',
        'but_8': '',
        'but_9': '',
        'msg': ''}
        for (let temp_counter = 0; temp_counter < 9; temp_counter++){
            if (temp_board_state[temp_counter] === '0'){
                init_obj[`but_${temp_counter+1}`] = '';
            }else if(temp_board_state[temp_counter] === 'x'){
                init_obj[`but_${temp_counter+1}`] = 'X';
            }else{
                init_obj[`but_${temp_counter+1}`] = 'O';
            }
            
        }
        io.to(room_number).emit('web-render-msg', init_obj)
        game_active.last_obj = JSON.parse(JSON.stringify(init_obj));
        let isWin = current_board.check_for_win(current_board);
        let empty_pos = current_board.get_empty_pos(current_board);
        let temp_pl_1_id = game_active.player1_user_id;
        let temp_pl_2_id = game_active.player2_user_id;
        let temp_pl_1_name = game_active.player1;
        let temp_pl_2_name = game_active.player2;
        if (isWin){
            if (current_turn === 2){
                io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)})
                game_active.current_result = 'P1';
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 2);
            }else{
                io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)})
                game_active.current_result = 'P2';
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 1);
        }

        }else{
            if(empty_pos.length === 0){
                io.to(room_number).emit('result_here', {result: 'D', string: "none"})
                game_active.current_result = 'D';
                if (current_turn === 1){
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 1);
            }else{
                User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                    if(err){
                        console.log(err);
                    }
                })
                updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 2);
            }
            }else{
                let compMove = nextMove(current_board, comp_sym);
                current_board.make_move(comp_sym, compMove, current_board);
                let temp_board_state = current_board.get_board_as_val(current_board);
                let current_turn__ = game_active.current_player;
                if (current_turn__ === 1){
                    game_active.current_player = 2;
                }else{
                    game_active.current_player = 1;
                }
                let init_obj = {
                'current_turn': game_active.current_player,
                'but_1': '',
                'but_2': '',
                'but_3': '',
                'but_4': '',
                'but_5': '',
                'but_6': '',
                'but_7': '',
                'but_8': '',
                'but_9': '',
                'msg': ''}
                for (let temp_counter = 0; temp_counter < 9; temp_counter++){
                    if (temp_board_state[temp_counter] === '0'){
                        init_obj[`but_${temp_counter+1}`] = '';
                    }else if(temp_board_state[temp_counter] === 'x'){
                        init_obj[`but_${temp_counter+1}`] = 'X';
                    }else{
                        init_obj[`but_${temp_counter+1}`] = 'O';
                    }
                    
                }
                io.to(room_number).emit('web-render-msg', init_obj)
                game_active.last_obj = JSON.parse(JSON.stringify(init_obj));
                let isWin = current_board.check_for_win(current_board);
                let empty_pos = current_board.get_empty_pos(current_board);
                let temp_pl_1_id = game_active.player1_user_id;
                let temp_pl_2_id = game_active.player2_user_id;
                let temp_pl_1_name = game_active.player1;
                let temp_pl_2_name = game_active.player2;
                if (isWin){
                    if (game_active.current_player === 1){
                    io.to(room_number).emit('result_here', {result: 'P2', string: current_board.get_which_win(current_board)})
                    game_active.current_result = 'P2';
                    User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"L"}}}, (err, follower_)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                    User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"W"}}}, (err, follower_)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                    updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P2', 2);
                }else if (game_active.current_player === 2){
                        io.to(room_number).emit('result_here', {result: 'P1', string: current_board.get_which_win(current_board)})
                        game_active.current_result = 'P1';
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"W"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"L"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'P1', 1);
                }
                }else{
                    if(empty_pos.length === 0){
                        if ((game_active.current_player === 2)){
                        io.to(room_number).emit('result_here', {result: 'D', string: "none"})
                        game_active.current_result = 'D';
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 1);
                    }else{
                        io.to(room_number).emit('result_here', {result: 'D', string: "none"})
                        game_active.current_result = 'D';
                        User.findByIdAndUpdate(temp_pl_1_id, {$push: {'games':{'opponent': temp_pl_2_id, 'me_first_player': true, 'opponent_name':temp_pl_2_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        User.findByIdAndUpdate(temp_pl_2_id, {$push: {'games':{'opponent': temp_pl_1_id, 'me_first_player': false, 'opponent_name':temp_pl_1_name, result:"D"}}}, (err, follower_)=>{
                            if(err){
                                console.log(err);
                            }
                        })
                        updateWLDGcount(temp_pl_1_id, temp_pl_2_id, 'D', 2);
                    }
                    }
                }
            }
        }
    }
    socket.on('make-this-move', (obj_here)=>{
        let button_counter = obj_here.counter;
        let user_id = obj_here.user_id;
        if (active_players.has(user_id)){
            let sent_socket = user_id;
            let len_actv_game_arr = active_games.length;
            let room_number = undefined;
            let current_board = undefined;
            let isPlayer1;
            let game_active = undefined;
            for (let counter = 0; counter < len_actv_game_arr; counter++){
                //check which room does the sent_socket_belongs too.
                let game_ = active_games[counter];
                if ((game_.player1_user_id === sent_socket) || (game_.player2_user_id === sent_socket)){
                    game_active = game_;
                    room_number = game_.room_name;
                    current_board = game_.board_state;
                    if (game_.player1_user_id === sent_socket){
                        isPlayer1 = true;
                    }else{
                        isPlayer1 = false;
                    }
                }
            }
            if (game_active.current_result === 0){
                if (game_active.isWithComp){                   
                    if ((isPlayer1)&&(game_active.current_player === 1)){
                        comp_make_move_render(room_number, game_active, current_board, o_sym, button_counter-1, 2, x_sym);
                    }else if((!(isPlayer1))&&(game_active.current_player === 2)){
                        comp_make_move_render(room_number, game_active, current_board, x_sym, button_counter-1, 1, o_sym);
                        console.log("Got Here!")
                    }
                }else{
                    if ((isPlayer1) && (game_active.current_player === 1)){
                        make_move_render(room_number, game_active, current_board, o_sym, button_counter-1, 2);                    
                    }else if ((!(isPlayer1)) && (game_active.current_player === 2)){
                        make_move_render(room_number, game_active, current_board, x_sym, button_counter-1, 1);                 
                    }
                    else{
                        socket.emit('not-your-turn', "Please Wait For Your Turn!");
                    }
                }
            }
        }
    })

    socket.on('connect-with-computer', (user)=>{
        let user_id = user.user_id;
        let user_name = user.user_name;
        let user_opt = user.opt;
        let new_board_state = new Board(empty_sym, x_sym, o_sym, [empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym, empty_sym]);
        let new_game;
        let player1;
        let player2;
        if (user_opt === 'o'){
            new_game = new active_game(user_name, 'COMPUTER-BOT-HERE', user_id, 'COMPUTER-BOT-HERE');
            player1 = user_name;
            player2 = 'Computer Bot';
        }else if(user_opt === 'x'){
            new_game = new active_game('COMPUTER-BOT-HERE', user_name, 'COMPUTER-BOT-HERE', user_id);
            player2 = user_name;
            player1 = 'Computer Bot';
        }else {
            let rand_num = Math.random();
            if (rand_num > 0.5){
                new_game = new active_game('COMPUTER-BOT-HERE', user_name, 'COMPUTER-BOT-HERE', user_id);
                player2 = user_name;
                player1 = 'Computer Bot';
            }else{
                new_game = new active_game(user_name, 'COMPUTER-BOT-HERE', user_id, 'COMPUTER-BOT-HERE');
                player1 = user_name;
                player2 = 'Computer Bot';
            }
        }
        new_game.board_state = new_board_state;
        new_game.isWithComp = true;
        active_games.push(new_game);
        socket.join(`${user_id}`)
        new_game.room_name = `${user_id}`;
        console.log('Clients in this room: ', io.sockets.adapter.rooms.get(new_game.room_name));
        //const players_in_this_room = io.sockets.adapter.rooms.get(user_id);
        active_players = new Set([...active_players, user_id]);
        let temp_msg = {
            'connect-success': true,
            'your-turn': true
        };
        let your_turn = true;
        io.to(`${user_id}`).emit('computer-connect', `${player1}---|---${player2}`);
        let temp_obj_t = {
            'current_turn': 1,
            'but-enable': true,
            'but_1': '',
            'but_2': '',
            'but_3': '',
            'but_4': '',
            'but_5': '',
            'but_6': '',
            'but_7': '',
            'but_8': '',
            'but_9': '',
            'msg': 'Good Luck Defeating The Bot!'
        }
        io.to(`${user_id}`).emit('web-render-msg', temp_obj_t)
        new_game.last_obj = JSON.parse(JSON.stringify(temp_obj_t));
        if (player1 === 'Computer Bot'){
            new_game.current_player = 2;
            current_board = new_game.board_state;
            current_board.make_move(o_sym, 4, current_board);
            let temp_board_state = current_board.get_board_as_val(current_board);
            let init_obj = {
            'current_turn': 2,
            'but_1': '',
            'but_2': '',
            'but_3': '',
            'but_4': '',
            'but_5': '',
            'but_6': '',
            'but_7': '',
            'but_8': '',
            'but_9': '',
            'msg': ''}
            for (let temp_counter = 0; temp_counter < 9; temp_counter++){
                if (temp_board_state[temp_counter] === '0'){
                    init_obj[`but_${temp_counter+1}`] = '';
                }else if(temp_board_state[temp_counter] === 'x'){
                    init_obj[`but_${temp_counter+1}`] = 'X';
                }else{
                    init_obj[`but_${temp_counter+1}`] = 'O';
                }
                
        }
        io.to(`${user_id}`).emit('web-render-msg', init_obj)
            }
    });

    socket.on('chat-msg-user', (msg)=>{
        let msg_text = msg.msg_txt;
        let msg_sender = msg.user_id;
        let msg_time = moment().format('h:mm a');
        //First Check if The User is in a Live Game:
        if (active_players.has(msg_sender)){
            //Find the room number in which the player is in:
            let sent_socket = msg.user_id;
            let len_actv_game_arr = active_games.length;
            let room_number = undefined;
            let current_board = undefined;
            let isPlayer1;
            let game_active = undefined;
            let msg_sender = undefined;
            for (let counter = 0; counter < len_actv_game_arr; counter++){
                let game_ = active_games[counter];
                if ((game_.player1_user_id === sent_socket) || (game_.player2_user_id === sent_socket)){
                    game_active = game_;
                    room_number = game_.room_name;
                    current_board = game_.board_state;
                    if (game_.player1_user_id === sent_socket){
                        isPlayer1 = true;
                    }else{
                        isPlayer1 = false;
                    }
                }
            }
            if (isPlayer1){
                msg_sender = game_active.player1;
            }else{
                msg_sender = game_active.player2;
            }
            io.to(room_number).emit('chat-msg-server', {msg_sender, msg_text, msg_time});

        }

    })
    socket.on('user-post-request', (post_)=>{
        let post_user_id = post_.user_id;
        let poster_name = '';
        let post_user_title = post_.user_post_title;
        let post_user_content = post_.user_post_content;
        let post_time = moment().format('MMMM Do YYYY, h:mm a');
        let post_id = '';
        let poster_name_arr = []
        User.findById(post_user_id, (err, docs)=>{
            if (err) {
                console.log(err)
            }else{
                post_id = `${post_user_id}` + '***' + `${docs.posts.length}`;
                poster_name = docs.name;
                poster_name_arr.push(docs.name);
                let zero_ = 0;
                User.findByIdAndUpdate(post_user_id, 
                    {$push: {"posts": {"post_id_u": post_id, "title_u": post_user_title, "content_u": post_user_content, "date_u": post_time, "poster_name_u": poster_name, "like_count": zero_}}},
                    {safe: true, upsert: true, new : true}, (err, docs)=>{
                    if (err) {console.log(err)
                    }else{
                        User.findById(post_user_id, (err, docs)=>{
                            if(err){console.log(err)
                            }else{
                            let user_followers_arr = [...docs.followers];
                            for (let counter = 0; counter < user_followers_arr.length; counter++){
                                User.findByIdAndUpdate(user_followers_arr[counter].userId, {$push: {'posts_to_show':post_id}}, (err, follower_)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        let notif_count_current = follower_.notif_count;
                                        let notif_count_mod = notif_count_current + 1;
                                        let notif_string = `${poster_name} Just Posted A Post!`;
                                        User.findByIdAndUpdate(user_followers_arr[counter].userId, {$push: {'notifications':notif_string}}, (err, docs)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                User.findByIdAndUpdate(user_followers_arr[counter].userId, {$set: {'notif_count':notif_count_mod}}, (err, docs)=>{
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        }
                        })
                    }
                }
                );
            }
        })
        //let temp_obj = {"post_id_u": post_id, "title_u": post_user_title, "content_u": post_user_content, "date_u": post_time, "poster_name_u": poster_name};
        //console.log("Tempo Objg", temp_obj);
        
        
    });
    socket.on('get-post-request', (string_for_post)=>{
        let post_type = string_for_post.split('--|--')[0];
        let post_index = string_for_post.split('--|--')[1];
        let user_pr_id = socket_id_dict[socket.id];
        let socket_id = socket.id;
        User.findById(user_pr_id, (err, docs)=>{
                if(err) {console.log(err)
                }else{
                    if (post_type === '0'){
                        if (docs.posts.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            let is_liked;
                            let post_index_int = (docs.posts.length - 1) - ((+post_index) % docs.posts.length);
                            let post_to_send = docs.posts[post_index_int];
                            let post_to_send_id = post_to_send.post_id_u;
                            if (docs.liked_posts.includes(post_to_send_id)){
                                is_liked = true;
                            }else{
                                is_liked = false;
                            }
                            socket.emit('post-request-reply', {type: 0, post_: docs.posts[post_index_int], is_liked});
                            
                        }
                    }else if(post_type === '1'){
                        if (docs.posts_to_show.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            let post_index_int = docs.posts_to_show.length - 1 -((+post_index) % docs.posts_to_show.length);
                            let feed_post_index = docs.posts_to_show[post_index_int].split('***')[1];
                            let feed_post_poster = docs.posts_to_show[post_index_int].split('***')[0]
                            
                            User.findById(feed_post_poster, (err, docs2)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                let post_to_send = docs2.posts[feed_post_index];
                                let post_to_send_id = post_to_send.post_id_u;
                                let is_liked;
                                if (docs.liked_posts.includes(post_to_send_id)){
                                    is_liked = true;
                                }else{
                                    is_liked = false;
                                }
                                socket.emit('post-request-reply', {type: 1, post_: post_to_send, is_liked});
                            }
                            })
                            
                        }
                    }else{
                        if (docs.liked_posts.length === 0){socket.emit('post-request-reply', 'LEN0')
                        }else{
                            let post_index_int = docs.liked_posts.length - 1 - ((+post_index) % docs.liked_posts.length);
                            let feed_post_index = docs.liked_posts[post_index_int].split('***')[1];
                            let feed_post_poster = docs.liked_posts[post_index_int].split('***')[0]
                            User.findById(feed_post_poster, (err, docs2)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                let post_to_send = docs2.posts[feed_post_index];
                                let post_to_send_id = post_to_send.post_id_u;
                                let is_liked;
                                if (docs.liked_posts.includes(post_to_send_id)){
                                    is_liked = true;
                                }else{
                                    is_liked = false;
                                }
                                socket.emit('post-request-reply', {type: 1, post_: post_to_send, is_liked});
                            }
                            })
                        }
                    }
                }        
        })
    })
    socket.on('change_post_liked_stat', (msg_stuff)=>{
        let is_liked = msg_stuff.is_liked;
        let post_id = msg_stuff.post_id;
        let user_id = socket_id_dict[socket.id];
        let poster_id = post_id.split('***')[0];
        let poster_post_index = +post_id.split('***')[1]
        var liker_name;
        if (is_liked){
            User.findByIdAndUpdate(user_id, {$pull: {'liked_posts':post_id}}, (err, docs)=>{
                
                User.findById(poster_id, (err, docs)=>{
                    let posts_arr = [...docs.posts]
                    let post_filtered_arr = posts_arr.filter((post_f)=>{return (post_f.post_id_u === post_id)});
                    let post_filtered = post_filtered_arr[0];
                    let current_like_count = +(post_filtered.like_count);
                    let modified_like_count = current_like_count - 1;
                    User.findOneAndUpdate({'_id':poster_id, "posts.post_id_u":post_id},{
                        "$set":{
                            "posts.$.like_count": modified_like_count
                        }
                    }, (err, docs)=>{
                        socket.emit("like-changed");
                    })
                })
            })
        }else{
            User.findByIdAndUpdate(user_id, {$push: {'liked_posts':post_id}}, (err, docs)=>{
                liker_name = docs.name;
                User.findById(poster_id, (err, docs)=>{
                    let posts_arr = [...docs.posts]
                    let post_filtered_arr = posts_arr.filter((post_f)=>{return (post_f.post_id_u === post_id)});
                    let post_filtered = post_filtered_arr[0];
                    let current_like_count = post_filtered.like_count;
                    let modified_like_count = +(current_like_count) + 1;
                    User.findOneAndUpdate(
                        {'_id': poster_id, 
                        "posts.post_id_u": post_id},
                        {
                            $set: {"posts.$.like_count": modified_like_count}
                        }
                    , (err, docs)=>{
                        if (err){console.log(err)
                        }else{
                        var notif_string = `${liker_name} Liked Your Post!`
                        User.findByIdAndUpdate(poster_id, {$push: {'notifications': notif_string}}, (err, docs)=>{
                            if(err){
                                console.log(err);
                            }else{
                                let notif_count_ = docs.notif_count;
                                let notif_count_mod = notif_count_ + 1;
                                User.findByIdAndUpdate(poster_id, {$set: {'notif_count': notif_count_mod}}, (err, docs)=>{
                                    if(err){
                                    console.log(err);
                                    }
                                })
                            }
                        })
                        socket.emit("like-changed");
                        }
                    })
                })
            })
        }
    })
    socket.on('chk_for_cur_active', (user_id_to_check)=>{
        for (let temp_counter = 0; temp_counter < active_games.length; temp_counter++){
            if ((active_games[temp_counter].player1_user_id === user_id_to_check) || (active_games[temp_counter].player2_user_id === user_id_to_check)){
                socket.join(active_games[temp_counter].room_name);
                socket.emit('web-render-msg', active_games[temp_counter].last_obj);
            }
        }
    })
    socket.on('get-user-game-count', (user_id_games)=>{
        User.findById(user_id_games, (err, docs)=>{
            socket.emit('post-user-game-count', {'win': docs.won_count, 'lost': docs.lost_count, 'draw': docs.draw_count, 'tot_games':docs.total_games_count});
        })
    })    
    socket.on('give-user-data', (data_id_obj)=>{
        let my_id = data_id_obj.my_id;
        let user_data_id = data_id_obj.user_id_profile;
        let obj_to_return = {'user_id': user_data_id,
                              'user_name': '',  
                             'tot_game_count': 0,
                             'won_game_count': 0,
                              'lost_game_count': 0,
                              'draw_game_count': 0,
                             'games_': [],
                             'followers_': [],
                             'following_': [],
                            'they_follow':false,
                            'i_follow': false};
        User.findById(user_data_id, (err, docs1)=>{
            User.findById(my_id, (err, docs)=>{
                obj_to_return.user_name = docs1.name;
                obj_to_return.tot_game_count = docs1.total_games_count;
                obj_to_return.won_game_count = docs1.won_count;
                obj_to_return.lost_game_count = docs1.lost_count;
                obj_to_return.draw_game_count = docs1.draw_count;
                let temp_games = JSON.parse(JSON.stringify(docs1.games));
                obj_to_return.games_ = temp_games.reverse();
                let other_person_followers = JSON.parse(JSON.stringify(docs1.followers));
                let other_person_following = JSON.parse(JSON.stringify(docs1.following));
                let my_followers = JSON.parse(JSON.stringify(docs.followers));
                let my_following = JSON.parse(JSON.stringify(docs.following));
                let other_follower_obj_arr = other_person_followers.map((follower)=>{return{
                    'name': follower.userName,
                    'id':follower.userId,
                    'they_follow': check_for_val(my_followers, follower.userId),
                    'i_follow': check_for_val(my_following, follower.userId)
                }})
                function check_for_val(array1, val){
                    if (array1){
                        for (let counter = 0; counter < array1.length; counter++){
                            if (array1[counter].userId === val){
                                return true
                            }
                        }
                    }
                    return false
                }
                let other_following_obj_arr = other_person_following.map((following)=>{return{
                    'name': following.userName,
                    'id':following.userId,
                    'they_follow': check_for_val(my_followers, following.userId),
                    'i_follow': check_for_val(my_following, following.userId)
                }})
                obj_to_return.followers_ = JSON.parse(JSON.stringify(other_follower_obj_arr));
                obj_to_return.following_ = JSON.parse(JSON.stringify(other_following_obj_arr));
                obj_to_return.i_follow = check_for_val(my_following, user_data_id);
                obj_to_return.they_follow = check_for_val(my_followers, user_data_id);
                socket.emit('return-user-data', obj_to_return);
            })

        })
        
        
    })
    socket.on('remove-from-prev-game', (user_id_to_remove)=>{
        let index_to_remove = 'none';
        for (let counter_3 = 0; counter_3 < active_games.length; counter_3++){
            if ((active_games[counter_3].player1_user_id === user_id_to_remove) || (active_games[counter_3].player2_user_id === user_id_to_remove)){
                index_to_remove = counter_3;
                
            }
        }
        if (index_to_remove !== 'none'){
            active_players.delete(active_games[index_to_remove].player1_user_id);
            active_players.delete(active_games[index_to_remove].player2_user_id);
            io.to(active_games[index_to_remove].room_name).emit('opp-next', '0');
            io.sockets.clients(active_games[index_to_remove].room_name).forEach(function(s){
                s.leave(active_games[index_to_remove].room_name);
            });
            socket.leave(active_games[index_to_remove].room_name);
            active_games.splice(index_to_remove);   
        }
    })
    socket.on('dm-msg-request', (some_obj)=>{
        let other_user_id = some_obj.other_user_id;
        let this_user_id = some_obj.my_id;

    })
    function post_dm_message(input_user_id, room_name_to_search){
        let user_id = input_user_id;
        User.findById(user_id, (err, docs)=>{
            let message_arr = docs.messages;
            let room_index = undefined;
            for (let temp_counter_4 = 0; temp_counter_4 < message_arr.length; temp_counter_4++){
                if (message_arr[temp_counter_4].room_name === room_name_to_search){
                    room_index = temp_counter_4;
                    io.to(room_name_to_search).emit('dm_msg_list', {'msg_content': message_arr[temp_counter_4].message_content});
                }
            }
        })
    }
    socket.on('join-socket-msg-room', (room_join_obj)=>{
        let room_to_join_dm = room_join_obj.room_to_join;
        let user_id = room_join_obj.user_id;
        post_dm_message(user_id, room_to_join_dm);
        socket.join(room_to_join_dm);
        socket.emit('room-joined-dm', '0');
    })
    socket.on('leave-socket-msg-room', (room_to_leave_dm)=>{
        socket.join(room_to_leave_dm);
        socket.emit('room-left-dm', '0');
    })
    socket.on('dm-msg-post', (post_obj)=>{
        console.log('DM MESSAGE REQUEST: ', post_obj)
        let room_dm_msg = post_obj.room_name;
        let sender_dm_id = post_obj.sender_id;
        let dm_msg_content = post_obj.msg_content;
        let id_arr = room_dm_msg.split('---|---');
        var other_person_id;
        if (id_arr[0] ===  sender_dm_id){
            other_person_id = id_arr[1]
        }else{
            other_person_id = id_arr[0]
        }
        console.log('Other Person ID: ', other_person_id);
        User.findById(sender_dm_id, (err, docs)=>{
            if (err){
                console.log(err);
            }else{
                let my_name = docs.name;
                let msg_arr = docs.messages;
                let room_index = 'null';
                for (let temp_counter_3 = 0; temp_counter_3 < msg_arr.length; temp_counter_3++){
                    if (msg_arr[temp_counter_3].room_name === room_dm_msg){
                        room_index = temp_counter_3;
                    }
                }
                if (!(room_index==='null')){
                    let msg_content_obj = {
                        'sender_name': my_name,
                        'sender_id': sender_dm_id,
                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),
                        'message_text': dm_msg_content,
                    }
                    User.findOneAndUpdate({'_id': sender_dm_id, "messages.room_name": room_dm_msg}, {$push: {
                        "messages.$.message_content": msg_content_obj
                    }}, (err, docs)=>{
                        if (err) {console.log(err)
                        }else{
                            User.findOneAndUpdate({'_id': other_person_id, "messages.room_name": room_dm_msg}, {$push:{
                                "messages.$.message_content": msg_content_obj 
                            }}, (err, docs=>{
                                if (err) {console.log(err)
                                }else{
                                    post_dm_message(sender_dm_id, room_dm_msg);
                                }
                            }))
                    
                            
                        }
                    })
                }else{
                    User.findById(other_person_id, (err, docs)=>{
                        if (err){console.log(err)
                        }else{
                            let other_person_name = docs.name;
                            let my_message_obj = {
                                "other_person_id": other_person_id,
                                "other_person_name": other_person_name,
                                "room_name": room_dm_msg,
                                "message_content": [
                                    {
                                        'sender_name': my_name,
                                        'sender_id': sender_dm_id,
                                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),
                                        'message_text': dm_msg_content
                                    }
                                ]
                            }

                            let other_message_obj = {
                                "other_person_id": sender_dm_id,
                                "other_person_name": my_name,
                                "room_name": room_dm_msg,
                                "message_content": [
                                    {
                                        'sender_name': my_name,
                                        'sender_id': sender_dm_id,
                                        'date_of_message': moment().format('MMMM Do YYYY, h:mm a'),
                                        'message_text': dm_msg_content
                                    }
                                ]
                            }
                            User.findOneAndUpdate({'_id': sender_dm_id}, {$push:{
                                messages: my_message_obj
                            }}, (err, docs)=>{
                                if (err) {console.log(err)
                                }else{
                                    User.findOneAndUpdate({'_id': other_person_id}, {$push:{
                                        messages: other_message_obj
                                    }}, (err, docs)=>{
                                        if(err){
                                            console.log(err);
                                        }else{
                                            post_dm_message(sender_dm_id, room_dm_msg);
                                        }
                                    })
                                }
                            })

                        }
                    })
                }
            }
        })
    })
    socket.on('get-user-msg-list', (user_id)=>{
        User.findById(user_id, (err, docs)=>{
            let msg_arr = docs.messages;
            let array_to_return = msg_arr.map((msg_inst)=>{return {'name':msg_inst.other_person_name, 'room_name':msg_inst.room_name}})
            socket.emit('user-list-msg-reply', array_to_return);
        })
    })
    socket.on('remove-follower', (rec_obj)=>{
        let id_1 = rec_obj.id_1;
        let id_2 = rec_obj.id_2;
        User.findOneAndUpdate({'_id': id_1}, {$pull:
        {'followers':{'userId':id_2}}}, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
                User.findById(id_2, (err, docs2)=>{
                    if(err){
                        console.log(err);
                    }else{
                        let feed_array = docs2.posts_to_show;
                        let liked_post_array = docs2.liked_posts;
                        for (let counter = 0; counter<feed_array.length; counter++){
                            let post_ = feed_array[counter];
                            if (post_.split('***')[0] == id_1){
                                User.findOneAndUpdate({'_id': id_2}, 
                                {$pull:
                                    {'posts_to_show':post_}
                                }, (err, docs)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                            }
                        }
                        for (let counter = 0; counter<liked_post_array.length; counter++){
                            let post_ = liked_post_array[counter];
                            if (post_.split('***')[0] == id_1){
                                User.findOneAndUpdate({'_id': id_2}, 
                                {$pull:
                                    {'liked_post':post_}
                                }, (err, docs)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                })
                            }
                        }
                        User.findOneAndUpdate({'_id': id_2}, {$pull:
                            {'following':{'userId':id_1}}}, (err, docs)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    socket.emit('refresh-prof', {'id_1':id_1, 'id_2':id_2});
                                }
                            })
                    }
                })
               

            }
        }
            )
    })
    socket.on('make-user-follow', (some_obj)=>{
        let id_1 = some_obj.id_1;
        let id_2 = some_obj.id_2;
        let name_1;
        let name_2;
        User.findById(id_2, (err, docs)=>{
            name_2 = docs.name;
            User.findOneAndUpdate({'_id': id_1}, {$push:
                {'following':{'userId':id_2, 'userName':name_2}}}, (err, docs)=>{
                    if(err){
                        console.log(err);
                    }else{
                        name_1 = docs.name;
                        User.findOneAndUpdate({'_id':id_2}, {$push:
                        {'followers':{'userId':id_1, 'userName':name_1}}}, (err, docs)=>{
                            if(err){console.log(err)
                            }else{
                                socket.emit('refresh-prof', {'id_1':id_1, 'id_2':id_2});
                                let notif_current_count = docs.notif_count;
                                let notif_count_mod = notif_current_count + 1;
                                let notif_string = `${name_1} Started Following You!`;
                                User.findByIdAndUpdate(id_2, {$push: {'notifications': notif_string}}, (err, docs)=>{
                                    if (err){
                                        console.log(err);
                                    }else{
                                    User.findByIdAndUpdate(id_2, {$set: {'notif_count':notif_count_mod}}, (err, docs)=>{
                                        if(err){
                                            console.log(err);
                                        }
                                    })
                                }
                                })
                            }
                        }
                        )
                    }
                }
        )
    })
        
    })
    socket.on('make-user-unfollow', (some_obj)=>{
        let id_1 = some_obj.id_1;
        let id_2 = some_obj.id_2;
        let name_1;
        let name_2;
        User.findOneAndUpdate({'_id': id_2}, {$pull:
            {'followers':{'userId':id_1}}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }else{
                    User.findById(id_1, (err, docs2)=>{
                        if(err){
                            console.log(err);
                        }else{
                            let feed_array = docs2.posts_to_show;
                            let liked_post_array = docs2.liked_posts;
                            for (let counter = 0; counter<feed_array.length; counter++){
                                let post_ = feed_array[counter];
                                if (post_.split('***')[0] == id_2){
                                    User.findOneAndUpdate({'_id': id_1}, 
                                    {$pull:
                                        {'posts_to_show':post_}
                                    },(err, docs)=>{
                                        if(err){
                                            console.log(err);
                                        }
                                    })
                                }
                            }
                            for (let counter = 0; counter<liked_post_array.length; counter++){
                                let post_ = liked_post_array[counter];
                                if (post_.split('***')[0] == id_2){
                                    User.findOneAndUpdate({'_id': id_1}, 
                                    {$pull:
                                        {'liked_post':post_}
                                    }, (err, docs)=>{
                                        if(err){
                                            console.log(err);
                                        }
                                    })
                                }
                            }
                            User.findOneAndUpdate({'_id': id_1}, {$pull:
                                {'following':{'userId':id_2}}}, (err, docs)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        socket.emit('refresh-prof', {'id_1':id_1, 'id_2':id_2});
                                    }
                                })
                        }
                    })  
                }
            })
    })
    socket.on('get-user-notif-count', (user_id)=>{
        User.findById(user_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            socket.emit('post-user-notif-count', docs.notif_count);
            }
        })
    })
    socket.on('get-notif-array', (user_id)=>{
        User.findById(user_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let notif_array_c = [...docs.notifications];
            let notif_array_return = notif_array_c.reverse();
            socket.emit('post-notif-array', notif_array_return);
            User.findByIdAndUpdate(user_id, {$set: {"notif_count": 0}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
            }
        })
    })

})



function updateWLDGcount(temp_player_1_id, temp_player_2_id, result_, which_computer){
    if (result_ === 'P1'){
        if (!(which_computer === 1)){
        User.findById(temp_player_1_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let won_count_final = docs.won_count + 1;
            let game_count_final = docs.total_games_count + 1;
            console.log("RAN 1")
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'won_count': won_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }   if (!(which_computer === 2)){
        User.findById(temp_player_2_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let lost_count_final = docs.lost_count + 1;
            let game_count_final = docs.total_games_count + 1;
            console.log("RAN 2")
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'lost_count': lost_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
    }else if (result_ === 'P2'){
        if (!(which_computer === 2)){
        User.findById(temp_player_2_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let won_count_final = docs.won_count + 1;
            let game_count_final = docs.total_games_count + 1;
            console.log("RAN 3")
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'won_count': won_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
        if (!(which_computer === 1)){
        User.findById(temp_player_1_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let lost_count_final = docs.lost_count + 1;
            let game_count_final = docs.total_games_count + 1;
            console.log("RAN 4")
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'lost_count': lost_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
    }else{
        if (!(which_computer === 2)){
        User.findById(temp_player_2_id, (err, docs)=>{
            if(err){
                console.log(err);
            }else{
            let draw_count_final = docs.draw_count + 1;
            let game_count_final = docs.total_games_count + 1;
            User.findByIdAndUpdate(temp_player_2_id, {$set: {'draw_count': draw_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
                if(err){
                    console.log(err);
                }
            })
        }
        }
        )
    }
    if (!(which_computer === 1)){
         User.findById(temp_player_1_id, (err, docs)=>{
             if(err){
                 console.log(err);
             }else{
            let draw_count_final = docs.draw_count + 1;
            let game_count_final = docs.total_games_count + 1;
            User.findByIdAndUpdate(temp_player_1_id, {$set: {'draw_count': draw_count_final, 'total_games_count': game_count_final}}, (err, docs)=>{
            if(err){
                console.log(err);
            }
            })
        }
        }
        )
    }
    }
}
