const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { rawListeners } = require('../../models/User');
router.get('/register', (req, res)=>{
    res.render("register");
})


router.get('/login', (req, res)=>{
    res.render("login");
})

router.post('/register', (req, res)=>{
    const name = req.body.userName;
    const email = req.body.userEmail;
    const password = req.body.userPassword;
    const password2 = req.body.userPassword2;
    const errors = [];
    if (!name || !email || !password || !password2){
        errors.push({msg: "Please Fill out all the required fields"});
    }
    if (password !== password2){
        errors.push({msg: "Passwords do not match. Try Again"});
    }
    if (password.length < 6){
        errors.push({msg: "The password should be atleast 6 characters long"});
    }
    if (errors.length > 0){
        res.render('register', {errors, name, email, password, password2});
    }else{
        User.findOne({email: email})
            .then(user=>{
                if(user){
                    errors.push({msg: "Email is already registered"});
                    res.render('register', {errors, name, email, password, password2});
                }else{
                    const newUser = new User({
                        name: name,
                        email: email,
                        password: password,
                    });
                    bcrypt.genSalt(10, (err, salt)=>{
                        bcrypt.hash(newUser.password, salt, (err, hash)=>{
                            if(err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user=>{
                                    req.flash('success_msg', 'You are now registered, and can login');
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                        })
                    });
                }
            })
    } 
})

router.post('/login', (req, res, next)=>{
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
})

router.get('/logout', (req, res)=>{
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
})
module.exports = router;