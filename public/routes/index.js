const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');
router.get('/', (req, res)=>{
    res.render('welcome');
})

router.get('/dashboard', ensureAuthenticated, (req, res)=>{
    res.render('dashboard', {user: req.user});
    console.log('Here is the User req.user that you wanted', req.user);
})
router.get('/message_room', ensureAuthenticated, (req, res)=>{
    res.render('message_room', {user: req.user});
})
router.get('/play_station', ensureAuthenticated, (req, res)=>{
    res.render('play_station', {user: req.user});
})

router.post('/play_station/live', ensureAuthenticated, (req, res)=>{
    res.render('play_station_lorc', {user:req.user, isLive: true});
})
router.post('/play_station/computer', ensureAuthenticated, (req, res)=>{
    res.render('play_station_lorc', {user:req.user, isLive: false});
})
module.exports = router;