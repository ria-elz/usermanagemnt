const express = require('express');
const { findUserByEmail, createUser } = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { updateUser, deleteUser, getEditUser } = require('../controller/userController');

const router = express.Router();


const JWT_SECRET = 'your-secret-key';

router.post("/register", 
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            const existingUser = await findUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: "User already exists!" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await createUser(name, email, hashedPassword);

            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true });
            req.session.token = token;

            res.redirect('/home');  
        } catch (err) {
            console.error("Error registering user:", err);
            res.status(500).json({ error: "Server error, please try again later." });
        }
    }
);

router.post("/login", 
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = await findUserByEmail(email);
            if (!user) return res.status(400).json({ error: "Invalid credentials" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

            const token = jwt.sign({ id: user.id, name: user.name, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true });
            req.session.token = token;
            req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role || 'user' };

            if (user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/home');
            }
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ error: "Server error, please try again later." });
        }
    }
);


router.get("/edit/:id", getEditUser);


router.post("/update", [
    body('id').notEmpty().withMessage('User ID is required'),
    body('name').notEmpty().withMessage('Name is required')
], updateUser);


router.get("/delete/:id", deleteUser);

module.exports = router;