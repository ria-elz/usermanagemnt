const db = require('../config/db');  

const createUser = async (name, email, password) => {
    try {
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    } catch (err) {
        console.error("Error inserting user into MySQL:", err);
        throw err;
    }
};

const findUserByEmail = async (email) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];  
    } catch (err) {
        console.error("Error fetching user from MySQL:", err);
        throw err;
    }
};

const findUserById = async (id) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    } catch (err) {
        console.error("Error fetching user by ID from MySQL:", err);
        throw err;
    }
};

const getAllUsers = async () => {
    try {
        const [rows] = await db.query('SELECT id, name, email, photo FROM users');  // Include photo
        return rows;
    } catch (err) {
        console.error("Error fetching all users from MySQL:", err);
        throw err;
    }
};

const updateUser = async (id, name, email, photo) => {
    try {
        const sqlQuery = photo
            ? 'UPDATE users SET name = ?, email = ?, photo = ? WHERE id = ?'
            : 'UPDATE users SET name = ?, email = ? WHERE id = ?';

        const params = photo ? [name, email, photo, id] : [name, email, id];
        await db.query(sqlQuery, params);
    } catch (err) {
        console.error("Error updating user in MySQL:", err);
        throw err;
    }
};



const deleteUser = async (id) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
    } catch (err) {
        console.error("Error deleting user from MySQL:", err);
        throw err;
    }
};

module.exports = { 
    createUser, 
    findUserByEmail,
    findUserById, 
    getAllUsers, 
    updateUser, 
    deleteUser 
};