const express = require('express');
const db = require('./config/db');  
const lRoute = require('./Routes/loginRoutes');
const { getAllUsers, updateUser } = require('./model/userModel'); 
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');  // For handling file uploads

const app = express();

const JWT_SECRET = 'your-secret-key';

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Serve uploaded photos

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


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');  
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });


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
            user: req.session.user || { name: 'Guest' }
        });
    } catch (err) {
        console.error("Error loading home page:", err);
        res.status(500).send("Server Error");
    }
});



app.post('/update', upload.single('photo'), async (req, res) => {
    try {
        const { id, name, email } = req.body;
        const photo = req.file ? req.file.filename : null;  // Store the uploaded filename
        await updateUser(id, name, email, photo);

        res.redirect('/home');
    } catch (err) {
        console.error("Error updating user information:", err);
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
