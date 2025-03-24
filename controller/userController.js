const bcrypt = require('bcrypt');
const pool = require('../config/db');  
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');


const JWT_SECRET = 'your-secret-key';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'riyasabu9946@gmail.com', 
        pass: 'ucga fvuc zlut gqvi'  
    }
});

const userAdd = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            console.log("User already exists. Redirecting to login...");
            return res.redirect('/login'); 
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        
        const mailOptions = {
            from: 'riyasabu9946@gmail.com',
            to: email,
            subject: 'Welcome to Our App!',
            text: `Hello ${name},\n\nWelcome to our app! We're excited to have you on board.\n\nBest Regards,\nThe Team`
        };
        
        await transporter.sendMail(mailOptions);

        res.status(201).redirect('/login');
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });  
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        req.session.token = token;
        req.session.user = { id: user.id, name: user.name, email: user.email };

        return res.redirect('/home');
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error, please try again" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id, name } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: "User ID and name are required" });
        }
        
        await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
        
        
        if (req.session.user && req.session.user.id == id) {
            req.session.user.name = name;
        }
        
        res.status(200).redirect('/home');
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Error updating user" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        
        
        if (req.session.user && req.session.user.id == userId) {
            res.clearCookie('token');
            req.session.destroy();
            return res.redirect('/login');
        }
        
        res.redirect('/home');
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Error deleting user" });
    }
};

const getEditUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.render('update', { user });
    } catch (error) {
        console.error("Error fetching user for edit:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const findUserById = async (id) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];  // Return user details
    } catch (err) {
        console.error("Error fetching user by ID from MySQL:", err);
        throw err;
    }
};

module.exports = { 
    userAdd, 
    loginUser, 
    updateUser, 
    deleteUser,
    getEditUser,
    findUserById
};