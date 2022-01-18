const socket = io();
let glob_is_userOnline = false;
let glob_user_show_stat = 0;
let glob_your_post_index = 0;
let glob_your_feed_index = 0;
let glob_liked_posts_index = 0;
let current_post_shown = 0;
let glob_is_post_liked = 0;
let glob_user_viewing = userId;
//const User = require('../../models/User');
socket.on('connect', ()=>{
    socket.emit('makeUserOnline', userId);
})
socket.on('disconnect', ()=>{
    socket.emit('makeUserOffline', userId);
})

socket.on('userMadeOnline', (msg)=>{
    glob_is_userOnline = true;
})
document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)"
socket.emit('get-user-game-count', userId);
socket.on('post-user-game-count', (game_count_obj)=>{
    let won_count = game_count_obj.win;
    let lost_count = game_count_obj.lost;
    let draw_count = game_count_obj.draw;
    let tot_count = game_count_obj.tot_games;
    document.querySelector('.w-val').innerHTML = `${won_count}&nbsp;`;
    document.querySelector('.l-val').innerHTML = `&nbsp;${lost_count}&nbsp;`;
    document.querySelector('.d-val').innerHTML = `&nbsp;${draw_count}`;
    document.querySelector('.num-games-val').innerHTML = `${tot_count}`;
})
socket.emit('get-user-notif-count', userId);
socket.on('post-user-notif-count', (notif_count)=>{
    /**<div class="bdg-but-2">Notifications: </div> */
    document.querySelector('.bdg-but-2').innerHTML = `Notifications: ${notif_count}`;
})
document.querySelector('.bdg-but-2').addEventListener('click', ()=>{
    socket.emit('get-notif-array', userId);
})
socket.on('post-notif-array', (notif_array)=>{
    let str_notif = '';
    if(notif_array){
        for (let counter = 0; counter < notif_array.length; counter++){
            str_notif += `<div class="notif-div">${notif_array[counter]}</div>`
        }
    }
    document.querySelector('.notif-panel-content').innerHTML = str_notif;
    document.querySelector('.notif-overlay').style.display = "block";
    document.getElementById('notif-close').addEventListener('click', ()=>{
        document.querySelector('.notif-overlay').style.display = "none";
    })
})
function showPostForm(){
    document.querySelector('.postFormOverlay').style.display = "block";
}
function hidePostForm(){
    document.querySelector('.postFormOverlay').style.display = "none";
}
function addPost(){
    let post_title = document.getElementById('_postTitle').value;
    let post_content = document.getElementById('_postContent').value;
    let user_id = userId;
    let post_obj = {"user_post_title": post_title, "user_post_content": post_content, "user_id": user_id};
    socket.emit('user-post-request', post_obj);
    document.querySelector('.postFormOverlay').style.display = "none";
}
document.querySelector('.add-button').addEventListener('click', showPostForm);
document.getElementById('cancelBut').addEventListener('click', hidePostForm);
document.getElementById('postBut').addEventListener('click', addPost);

document.querySelector('.prev-button').addEventListener('click', ()=>{showPost(-1)});
document.querySelector('.next-button').addEventListener('click', ()=>{showPost(+1)});

document.querySelector('.user-posts-but').addEventListener('click', activateUserPost)
document.querySelector('.feed-but').addEventListener('click', activateFeedPost)
document.querySelector('.liked-posts-but').addEventListener('click', activateLikedPost)

function activateUserPost(){
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.2)";
   document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0)";
  document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0)";
    glob_user_show_stat = 0;
    showPost(0);
}

function activateFeedPost(){
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.0)";
    document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0.2)";
    document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0)";
    glob_user_show_stat = 1;
    showPost(0);
}

function activateLikedPost(){
    document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0,0,0,0.2)";
    document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0,0,0,0.0)";
    document.querySelector('.feed-but').style.backgroundColor = "rgba(0,0,0,0)";
    glob_user_show_stat = 2;
    showPost(0);
}
function showPost(indexer){
    document.querySelector('.feed-container').style.backgroundColor = getRandomColor();
    let string_for_post;
    if (glob_user_show_stat === 0){
        glob_your_post_index = Math.max(glob_your_post_index + indexer, 0);
        string_for_post = `${glob_user_show_stat}--|--${glob_your_post_index}`;
    }else if(glob_user_show_stat === 1){
        glob_your_feed_index = Math.max(glob_your_feed_index + indexer, 0);
        string_for_post = `${glob_user_show_stat}--|--${glob_your_feed_index}`;
    }else{
        glob_liked_posts_index = Math.max(glob_liked_posts_index + indexer, 0);
        string_for_post = `${glob_user_show_stat}--|--${glob_liked_posts_index}`;
    }
    socket.emit('get-post-request', string_for_post);
}
function displayPost(poster_name_s, post_title_s, post_content_s, post_date_s, is_liked, like_count, post_id_s){
    let poster_id = post_id_s.split('***')[0];
    document.querySelector('.meta-info').innerHTML = `<span class="post-profile-show" id="${poster_id}">${poster_name_s}</span>` + ' ' + post_date_s;
    document.querySelector('.post-title').innerHTML = post_title_s;
    document.querySelector('.post-content').innerHTML = post_content_s;
    document.getElementById('like_post').style.visibility = "visible"
    if(is_liked){
        document.getElementById('like_post').innerHTML = `Dislike ${like_count}`;
        glob_is_post_liked = true;
    }else{
        document.getElementById('like_post').innerHTML = `Like ${like_count}`;
        glob_is_post_liked = false;
    }
    addEL(userId);
}
function addEL(userId){
    const span_ = document.querySelector('.post-profile-show');
    span_.addEventListener('click', ()=>{
        showProfile(span_.id, userId);
        glob_user_viewing = span_.id;
    })
}
function displayNoPosts(){
    document.querySelector('.meta-info').innerHTML = '';
    document.querySelector('.post-title').innerHTML = '';
    document.querySelector('.post-content').innerHTML = 'You have no posts here!';
    document.getElementById('like_post').style.visibility = "hidden"
}
socket.on('post-request-reply', (reply)=>{
    if (reply === 'LEN0'){
        displayNoPosts();
    }else{
    let post_server = reply.post_;
    let is_liked = reply.is_liked;
    let type_ = reply.type_
    displayPost(post_server.poster_name_u, post_server.title_u, post_server.content_u, post_server.date_u, is_liked, post_server.like_count, post_server.post_id_u);
    current_post_shown = post_server.post_id_u;}
})

function getRandomColor() {
    var letters = 'BCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

document.getElementById('like_post').addEventListener('click', ()=>{
    if (current_post_shown != 0){
    socket.emit('change_post_liked_stat', {"is_liked": glob_is_post_liked, "post_id": current_post_shown})
    glob_is_post_liked = !(glob_is_post_liked);
    }
});

socket.on('like-changed', ()=>{
    showPost(0);
})


document.querySelector('.user-posts-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 0)){
        document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
})

document.querySelector('.user-posts-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 0)){
        document.querySelector('.user-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
})

document.querySelector('.feed-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 1)){
        document.querySelector('.feed-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
})

document.querySelector('.feed-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 1)){
        document.querySelector('.feed-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
})

document.querySelector('.liked-posts-but').addEventListener('mouseenter', ()=>{
    if (!(glob_user_show_stat === 2)){
        document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    }
})

document.querySelector('.liked-posts-but').addEventListener('mouseleave', ()=>{
    if (!(glob_user_show_stat === 2)){
        document.querySelector('.liked-posts-but').style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
})

document.getElementById('play-but').addEventListener('click', ()=>{
    location.href="/play_station";
})


function showProfile(user_id_profile, my_id){
    socket.emit('give-user-data', {"my_id": my_id, "user_id_profile": user_id_profile});
}

function dm_message(my_id, other_id, other_name){
    sessionStorage.setItem("dm_message", `${other_id}---|---${my_id}---|---${other_name}`);
    location.href="/message_room"
}

document.querySelector('.bdg-but-1').addEventListener('click', ()=>{
    showProfile(userId, userId);
    glob_user_viewing = userId;
})

socket.on('return-user-data', (return_obj)=>{
    displayProfile(return_obj, userId);
})
function displayProfile(profile_obj, userId){
    let user_name = profile_obj.user_name;
    let user_id = profile_obj.user_id;
    let tot_games_played = profile_obj.tot_game_count;
    let won_games_count = profile_obj.won_game_count;
    let lost_games_count = profile_obj.lost_game_count;
    let draw_games_count = profile_obj.draw_game_count;
    let game_arr = profile_obj.games_;
    let follower_arr = profile_obj.followers_;
    let following_arr = profile_obj.following_;
    let game_history_string = '';
    if (game_arr){
    for (let counter_1 = 0; counter_1 < game_arr.length; counter_1++){
        let game_instance = game_arr[counter_1];
        let temp_string = '';
        temp_string = getResultString(game_instance.me_first_player, user_name, game_instance.opponent_name, game_instance.result, game_instance.opponent, user_id, userId);
        game_history_string += `<div class="gh">${temp_string}</div>`;
    }}
    let follower_string = '';
    if (follower_arr){
    
    for (let counter_2 = 0; counter_2 < follower_arr.length; counter_2++){
        let follower_instance = follower_arr[counter_2];
        let but_string = "";
        if (follower_instance.id !== userId){
            let button_id = `dm---|---${follower_instance.id}---|---${follower_instance.name}`;
            but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`
        }
        let id_for_follower;
        let ih_for_follower;
        let but_class_rf = "";
        let but_class_fb = "";
        if (follower_instance.id !== userId){
        if (follower_instance.they_follow === true){
            id_for_follower = `rmv-follower---|---${userId}---|---${follower_instance.id}`;
            ih_for_follower = 'Remove Follower';
            but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`           
        }
        if (follower_instance.i_follow === true){
            id_for_follower = `unfollow---|---${userId}---|---${follower_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`
        }else{
            id_for_follower = `follow---|---${userId}---|---${follower_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`
        }
    }
        follower_string += `
        <div class="prof-badge">
        <div class="prof-name-msg">
            <div class="prof-name"><span class="bdg-prof-link" id="${follower_instance.id}---|---${userId}">${follower_instance.name}</span></div>
           ${but_string}
        </div>
        <div class="prf-bdg-but-place">
        ${but_class_rf}
        ${but_class_fb}
        </div>       
        </div>`
    }
}
    let following_string = '';
    if (following_arr){
    for (let counter_2 = 0; counter_2 < following_arr.length; counter_2++){
        let following_instance = following_arr[counter_2];
        let but_string = "";
        if (following_instance.id !== userId){
            let button_id = `dm---|---${following_instance.id}---|---${following_instance.name}`;
            but_string = `<div class="prof-bdg-msg"><button id=${button_id} class="dm-msg-but-id">Message</button></div>`
        }
        let id_for_follower;
        let ih_for_follower;
        let but_class_rf = "";
        let but_class_fb = "";
        if (following_instance.id !== userId){
        if (following_instance.they_follow === true){
            id_for_follower = `rmv-follower---|---${userId}---|---${following_instance.id}`;
            ih_for_follower = 'Remove Follower';
            but_class_rf = `<button class="rmv-flwr" id=${id_for_follower}>Remove Follower</button>`           
        }
        if (following_instance.i_follow === true){
            id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Unfollow</button>`
        }else{
            id_for_follower = `unfollow---|---${userId}---|---${following_instance.id}`;
            but_class_fb = `<button class="fl-bk" id=${id_for_follower}>Follow</button>`
        }
    }
        following_string += `
        <div class="prof-badge">
        <div class="prof-name-msg">
            <div class="prof-name"><span class="bdg-prof-link" id="${following_instance.id}---|---${userId}">${following_instance.name}</span></div>
            ${but_string}
        </div>
        <div class="prf-bdg-but-place">
        ${but_class_rf}
        ${but_class_fb}      
        </div>
        </div>`
    }
    
}
    let dm_main_str = "";
    let flw_but_main_str = "";
    let rmv_fl_main_str = "";
    
    if (user_id !== userId){
        let but_id_dm = `dm---|---${user_id}---|---${user_name}`;
        dm_main_str = `<div class="dm_msg_main"><button class="dm_but_main" id=${but_id_dm}>Message</button></div>`;
        if (profile_obj.i_follow){
            let but_id = `unfollow---|---${userId}---|---${user_id}`;
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Unfollow</button></div>`;
        }else{
            let but_id = `follow---|---${userId}---|---${user_id}`;
            flw_but_main_str = `<div class="follow-main"><button class="fl-main" id=${but_id}>Follow</button></div>`;
        }
        if(profile_obj.they_follow){
            let but_id = `rmv-follower---|---${userId}---|---${user_id}`;
            rmv_fl_main_str = `<div class="remove-follower"><button class="rmv-fl-main" id=${but_id}>Remove Follower</button></div>`;
        }
    }
    

    let str_to_add = `<div class="profile-place">
    <div class="pp-top">
        <div class="profile-user-name">
            ${user_name}
        </div>
        ${dm_main_str}
        ${flw_but_main_str}
        ${rmv_fl_main_str}
        <div class="pp-close-but"><button class="pp-close-but-main">Close</button></div>
    </div>
    <div class="pp-bottom">
        <div class="profile-games">
            <div class="pg-header">
                <div class="pg-title">Games</div>
                <div class="pg-stats">
                    <div class="pg-tot">Total: ${tot_games_played}</div>
                    <div class="pg-won">Won: ${won_games_count}</div>
                    <div class="pg-lost">Lost: ${lost_games_count}</div>
                    <div class="pg-draw">Draw: ${draw_games_count}</div>
                </div>
            </div>
            <div class="game-history">
                ${game_history_string}
            </div>
        </div>
        <div class="pp-followers">
            <div class="pp-frs-title">
                Followers (${follower_arr.length || '0'})
            </div>
            <div class="pp-frs-content">
            ${follower_string}
            </div>

        </div>
        <div class="pp-following">
            <div class="pp-fng-title">
                Following (${following_arr.length || '0'})
            </div>
            <div class="pp-fng-content">
            ${following_string}
            </div>
        </div>
    </div>
    </div>`
    document.querySelector('.profile-place-overlay').style.display = "block";
    document.querySelector('.profile-place-overlay').innerHTML = str_to_add;
    addEL_dm_but(user_id);
}

function addEL_dm_but(input_user_id){
    const dm_but_arr = document.querySelectorAll('.dm-msg-but-id');
    const rmv_flwr_but_arr = document.querySelectorAll('.rmv-flwr');
    const flw_un_but_arr = document.querySelectorAll('.fl-bk');
    const follow_main_but = document.querySelector('.fl-main');
    const rmv_flwr_main_but = document.querySelector('.rmv-fl-main');
    const close_main_but = document.querySelector('.pp-close-but');
    const dm_but_main = document.querySelector('.dm_but_main');
    const bdg_prof_link = document.querySelectorAll('.bdg-prof-link');
    if (bdg_prof_link){
        for (let counter = 0; counter < bdg_prof_link.length; counter++){
            let link_id = bdg_prof_link[counter].id;
            let my_id = link_id.split('---|---')[1];
            let other_id = link_id.split('---|---')[0];
            bdg_prof_link[counter].addEventListener('click', ()=>{
                showProfile(other_id, my_id);
                glob_user_viewing = other_id;
            });
        }
    }
    if (dm_but_main){
    let dm_but_id = dm_but_main.id;
    let other_user_id = dm_but_id.split('---|---')[1];
    let other_user_name = dm_but_id.split('---|---')[2];
    dm_but_main.addEventListener('click', ()=>{dm_message(input_user_id, other_user_id, other_user_name)});
    }
    close_main_but.addEventListener('click', ()=>{
        document.querySelector('.profile-place-overlay').style.display = "none";
        document.querySelector('.profile-place-overlay').innerHTML = "";
    })
    if (follow_main_but){
        let task_of_but = follow_main_but.id.split('---|---')[0];
        let my_id = follow_main_but.id.split('---|---')[1];
        let other_id = follow_main_but.id.split('---|---')[2];
        if (task_of_but === 'follow'){
            follow_main_but.addEventListener('click', ()=>{
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id});
            })
        }else if(task_of_but === 'unfollow'){
            follow_main_but.addEventListener('click', ()=>{
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id});
            })
        }
    }
    if (rmv_flwr_main_but){
        let but_id = rmv_flwr_main_but.id;
        let my_id = but_id.split('---|---')[1];
        let other_id = but_id.split('---|---')[2];
        rmv_flwr_main_but.addEventListener('click', ()=>{socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id})})
    }
    for (let counter_1 = 0; counter_1 < dm_but_arr.length; counter_1++){
        let but_id = dm_but_arr[counter_1].id;
        let other_user_id = but_id.split('---|---')[1];
        let other_user_name = but_id.split('---|---')[2];
        dm_but_arr[counter_1].addEventListener('click', ()=>{dm_message(input_user_id, other_user_id, other_user_name)});
    }
    for (let counter_2 = 0; counter_2 < rmv_flwr_but_arr.length; counter_2++){
        let but_id = rmv_flwr_but_arr[counter_2].id;
        let my_id = but_id.split('---|---')[1];
        let other_id = but_id.split('---|---')[2];
        rmv_flwr_but_arr[counter_2].addEventListener('click', ()=>{socket.emit('remove-follower', {'id_1':my_id, 'id_2': other_id})})
    }
    for (let counter_3 = 0; counter_3 < flw_un_but_arr.length; counter_3++){
        let but_id = flw_un_but_arr[counter_3].id;
        let task_but = but_id.split('---|---')[0];
        let my_id = but_id.split('---|---')[1];
        let other_id = but_id.split('---|---')[2];
        if (task_but === 'follow'){
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-follow', {'id_1':my_id, 'id_2':other_id});
            })
        }else if(task_but === 'unfollow'){
            flw_un_but_arr[counter_3].addEventListener('click', ()=>{
                socket.emit('make-user-unfollow', {'id_1':my_id, 'id_2':other_id});
            })
        }
        
    }
}
socket.on('refresh-prof', (some_obj)=>{
    let id_1 = some_obj.id_1;
    let id_2 = some_obj.id_2;
    showProfile(glob_user_viewing, id_1);
}
)
function getResultString(is_me_first, my_name, opponent_name, result, opp_id, prof_user_id, userId){
    if (opponent_name === 'COMPUTER-BOT-HERE'){
        opponent_name = "Computer";
    }
    if (is_me_first === 'true'){
        if (result === 'W'){
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`
        }else if(result === 'L'){
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:green">Won</div>`
        }else{
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`
        }
    }else{
        if (result === 'L'){
            return `<div class="result_" style="color:green">Won</div>
            <div class="result_name" style="color: green">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: red">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:red">Lost</div>`
        }else if(result === 'W'){
            return `<div class="result_" style="color:red">Lost</div>
            <div class="result_name" style="color: red">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: green">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:green">Won</div>`
        }else{
            return `<div class="result_" style="color:white">Draw</div>
            <div class="result_name" style="color: white">O:&nbsp;<span class="bdg-prof-link" id="${opp_id}---|---${userId}">${opponent_name}</span></div>
            <div class="result_name" style="color: white">X:&nbsp;<span class="bdg-prof-link" id="${prof_user_id}---|---${userId}">${my_name}</span></div>
            <div class="result_" style="color:white">Draw</div>`
        }
    }
}
document.querySelector('.bdg-but-3').addEventListener('click', ()=>{
    location.href="/message_room";
})