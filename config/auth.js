module.exports = {
    ensureAuthenticated: function(req, res, next){
        if (req.isAuthenticated()){
            return next()
        }
        req.flash('error_msg', 'Please Login To View This Resource');
        res.redirect('/users/login');
    }
}