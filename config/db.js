const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          
    password: 'root',          
    database: 'express',       
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("MySQL Connection Error:", err);
    } else {
        console.log("MySQL Database connected");
        connection.release(); 
    }
});

module.exports = pool.promise();