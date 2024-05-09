const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/user.js');
const mailer = require('../utils/mailer.js');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;

const JWT_SECRET = 'SHY23FDA45G2G1K89KH5sec4H8KUTF85ret';

router.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000 
    }
}));

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}


router.post('/register', async function(req, res) {
    try {
        const { name, email, username, password, phoneNumber,confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists, choose another' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name,
            email: email,
            username: username,
            password: hash,
            phoneNumber:phoneNumber,
            admin: 0
        });
        await newUser.save();

        await mailer(email, 'reg', 'Welcome to Raattai and happy purchasing. Please confirm your registration by login to http://3.6.184.48:3000/login');
       
        res.json({ success: 'You will receive an email notification.' });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return res.status(500).json({ error: 'Error authenticating user' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error logging in user' });
            }
            return res.json({ message: 'Login successful', user: req.user });
        });
    })(req, res, next);
});

router.get('/get-user',(req,res)=>{
    const user=req.user
    res.json({ user });
})


router.get('/logout', async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'You are not logged in' });
        }

        req.logout(function(err) {
            if (err) {
                console.error('Error logging out:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            req.session.destroy(function(err) {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ message: 'You are logged out!' });
            });
        });
    } catch (error) {
        console.error('Error rendering login page:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const OTP = generateOTP();
        await mailer(email, 'Password Reset OTP', `Your OTP for password reset is: ${OTP}`, `Your OTP for password reset is: <b>${OTP}</b>`);

        const token = jwt.sign({ email, OTP }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending email' });
    }
});

router.get('/get-user',(req,res)=>{
    const user=req.user
    res.json({ user });
})

router.post('/reset-password', async (req, res) => {
    try {
        const { token, OTP, newPassword } = req.body;
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.OTP !== parseInt(OTP)) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        user.password = hash;
        await user.save();
        req.logout();
        req.session.destroy(function(err) {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Password reset successfully. Please log in again.' });
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

module.exports = router;
