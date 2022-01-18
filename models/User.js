const mongoose = require('mongoose')
const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    onlineState:{
        type: String,
        default: "false"
    },
    isLookingForGame:{
        type: String,
        default: "false"
    },
    posts:[
        {
        post_id_u: String,
        title_u: String,
        content_u: String,
        date_u: String,
        poster_name_u: String,
        like_count: Number
    }
    ],
    followers:[
        {
            userId: String,
            userName: String
    }
    ],
    following:[
        {
            userId: String,
            userName: String
        }
        ]
    ,
    posts_to_show:[String],
    liked_posts:[String],
    notifications:[String],
    notif_count:{type: Number, default:0},
    games:[
        {
        opponent: String,
        me_first_player: String,
        opponent_name: String,
        result: String
    }
    ],
    won_count: {type: Number, default: 0},
    lost_count: {type: Number, default: 0},
    draw_count: {type: Number, default: 0},
    total_games_count: {type: Number, default: 0},
    messages:[
        {
            'other_person_id': String,
            'other_person_name': String,
            'room_name': String,
            'message_content': [
                {'sender_name': String,
                  'sender_id': String,
                 'date_of_message': String,
                 'message_text': String
                }
            ]
        }
    ]
}
)

const User = mongoose.model('User', UserSchema);
module.exports = User;