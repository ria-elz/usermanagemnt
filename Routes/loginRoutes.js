const express = require('express');
const { findUserByEmail, createUser,findUserById} = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { updateUser, deleteUser, getEditUser } = require('../controller/userController');
const multer = require('multer');
const path = require('path');

const router = express.Router();


const JWT_SECRET = 'your-secret-key';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

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

// Add this route to your loginRoutes.js file

router.get('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await findUserById(userId);  // Fetch user details from the database

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('userDetails', { user });  // Render user details page with fetched user data
    } catch (err) {
        console.error("Error fetching user details:", err);
        res.status(500).send('Server error');
    }
});



router.post("/update", upload.single('photo'), async (req, res) => {
    const { id, name, email, place } = req.body;
    const photo = req.file ? req.file.filename : null; 

    try {
        await updateUser(id, name, email, place, photo);  
        res.redirect('/home');
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).send("Server Error");
    }
});


router.get("/delete/:id", deleteUser);

module.exports = router;