const socket = io();
var dm_msg_request = sessionStorage.getItem("dm_message");
sessionStorage.removeItem("dm_message");
sessionStorage.clear();
let list_of_other_users = [];
let list_of_room_names = [];
let dm_other_user = [];
let current_room = undefined;
let dm_current_room = undefined;
if (dm_msg_request != null){
    let other_user_id = dm_msg_request.split('---|---')[0];
    let loc_my_id = dm_msg_request.split('---|---')[1];
    let other_user_name = dm_msg_request.split('---|---')[2];
    socket.emit('dm-msg-request', {other_user_id, loc_my_id});

    dm_other_user.push(`${loc_my_id}---|---${other_user_id}`);
    current_room = `${loc_my_id}---|---${other_user_id}`;
    dm_current_room = current_room;
    socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': true});
    let div_wrapper = document.createElement('div');
    socket.emit('get-dm-post', {'user_id': my_id, 'user_room': current_room})
    div_wrapper.className = "un-content";
    div_wrapper.id = current_room;
    div_wrapper.style.backgroundColor="#ca3e47af";
    div_wrapper.addEventListener('click', ()=>{
        socket.emit('leave-socket-msg-room', current_room);
        document.querySelector('.message-area').innerHTML = '';
        document.getElementById(current_room).style.backgroundColor = "#CA3E47";
        current_room = div_wrapper.id;
        socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': true});
        div_wrapper.style.backgroundColor="#ca3e47af";
    })
    div_wrapper.addEventListener('mouseenter', ()=>{
        if (current_room !== div_wrapper.id){
            div_wrapper.style.backgroundColor = "#ca3e47af"; 
        }
    })
    div_wrapper.addEventListener('mouseleave', ()=>{
        if (current_room !== div_wrapper.id){
            div_wrapper.style.backgroundColor = "#CA3E47"
        }
    })
    div_wrapper.innerHTML = `<div class="un-name">${other_user_name}</div>
    <div class="un-notif-count"></div>`
    document.querySelector('.user-names').appendChild(div_wrapper);


}
socket.emit('get-user-msg-list', my_id);
socket.on('user-list-msg-reply', (user_list_obj)=>{
    for (let temp_counter_1 = 0; temp_counter_1 < user_list_obj.length; temp_counter_1++){
        if (dm_current_room !== user_list_obj[temp_counter_1].room_name){
        let div_wrapper = document.createElement('div');
        div_wrapper.className = "un-content";
        div_wrapper.id = user_list_obj[temp_counter_1].room_name;
        div_wrapper.addEventListener('click', ()=>{
            socket.emit('leave-socket-msg-room', current_room);
            document.querySelector('.message-area').innerHTML = '';
            if (current_room){
                document.getElementById(current_room).style.backgroundColor = "#CA3E47";
            }
            current_room = div_wrapper.id;
            
            
            socket.emit('join-socket-msg-room', {'user_id': my_id, 'room_to_join': current_room, 'new_msg': false});
            div_wrapper.style.backgroundColor="#ca3e47af";
        })
        div_wrapper.addEventListener('mouseenter', ()=>{
            if (current_room !== div_wrapper.id){
                div_wrapper.style.backgroundColor = "#ca3e47af"; 
            }
        })
        div_wrapper.addEventListener('mouseleave', ()=>{
            if (current_room !== div_wrapper.id){
                div_wrapper.style.backgroundColor = "#CA3E47"
            }
        })
        div_wrapper.innerHTML = `<div class="un-name">${user_list_obj[temp_counter_1].name}</div>`
        //<div class="un-notif-count">${user_list_obj[temp_counter_1].notif_count} new notifications</div>`
        document.querySelector('.user-names').appendChild(div_wrapper);
        list_of_other_users.push(user_list_obj[temp_counter_1].name);
        list_of_room_names.push(user_list_obj[temp_counter_1].room_name);
    }
    }
})

document.getElementById('send-msg-but').addEventListener('click', ()=>{
    let text_box_elem = document.getElementById("msg-text-to-send");
    if (text_box_elem.value){
        socket.emit('dm-msg-post', {'room_name': current_room, 'sender_id': my_id, 'msg_content': text_box_elem.value});
        text_box_elem.value = "";
    }
}
)
socket.on('dm_msg_list', (someobj)=>{
    let list_of_messages = someobj.msg_content;
    let message_area_elem = document.querySelector('.message-area');
    let str_to_add = ''
    if (typeof(list_of_messages) !== undefined){
        for (let counter = 0; counter < list_of_messages.length; counter++){
            let message_ = list_of_messages[counter];
            str_to_add += `<div class="message-div">
            <div class="msg-meta-info"><div class="meta-text">${message_.sender_name}, ${message_.date_of_message}</div></div>
            <div class="msg-content">${message_.message_text}</div>
        </div>`

        }
    }
    message_area_elem.innerHTML = str_to_add;

})
