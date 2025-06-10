const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Based on knowledge from week 1's project, I at least wanted a fairly robust login system.
exports.getLoginPage = (req, res) => {
    if (req.session.userId) return res.redirect('/stories');
    res.render('login', { error: null, success: null, pageTitle: 'Login' });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { error: 'Please fill in all fields', success: null, pageTitle: 'Login' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials', success: null, pageTitle: 'Login' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials', success: null, pageTitle: 'Login' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/stories');
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Server error', success: null, pageTitle: 'Login' });
    }
};

exports.getRegisterPage = (req, res) => {
    if (req.session.userId) return res.redirect('/stories');
    res.render('register', { error: null, pageTitle: 'Register' });
};

exports.postRegister = async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Just authentication that all fields are netered
    if (!username || !password || !confirmPassword) {
        return res.render('register', { error: 'Please fill in all fields', pageTitle: 'Register' });
    }

    // Make sure passwords match
    if (password !== confirmPassword) {
        return res.render('register', { error: 'Passwords do not match', pageTitle: 'Register' });
    }

    // Good, now we check if user is already created
    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.render('register', { error: 'User already exists', pageTitle: 'Register' });
        }

        user = new User({ username, password });
        await user.save();

        // Log in immediately after registration
        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/stories');

    } catch (error) {
        console.error(error);
        res.render('register', { error: 'Error during registration', pageTitle: 'Register' });
    }
};

exports.getLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/stories');
        }
        res.clearCookie('connect.sid'); // Default cookie name for session.
        res.redirect('/auth/login');
    });
};