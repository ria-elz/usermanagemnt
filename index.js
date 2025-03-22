const express = require('express');
const db = require('./config/db');  
const lRoute = require('./Routes/loginRoutes');
const { getAllUsers } = require('./model/userModel'); 
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();


const JWT_SECRET = 'your-secret-key';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

const verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.session.token;
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded; 
        next();
    });
};

app.get('/home', verifyToken, async (req, res) => {
    try {
        const users = await getAllUsers(); 
        res.render('home', { 
            users,
            user: req.session.user || null
        });     
    } catch (err) {
        console.error("Error loading home page:", err);
        res.status(500).send("Server Error");
    }
});


app.get('/', (req, res) => {
    res.render('index', { user: req.session.user || null });
});


app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));


app.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    res.redirect('/login');
});


app.use("/", lRoute);


app.listen(3002, () => {
    console.log("Server is running on port 3002");
});