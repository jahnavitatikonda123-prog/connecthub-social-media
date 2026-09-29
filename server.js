const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// ================= MIDDLEWARE =================

app.use(express.json());
app.use(express.static(__dirname));

// ================= DATABASE =================

const db = new sqlite3.Database("./social.db", (error) => {
    if (error) {
        console.log("Database connection failed:", error.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

// ================= CREATE TABLES =================

db.serialize(() => {

    // USERS TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            bio TEXT DEFAULT ''
        )
    `);

    // POSTS TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // COMMENTS TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // FOLLOWERS TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS followers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower_id INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            UNIQUE(follower_id, following_id),
            FOREIGN KEY (follower_id) REFERENCES users(id),
            FOREIGN KEY (following_id) REFERENCES users(id)
        )
    `);
});

// ================= REGISTER =================

app.post("/api/register", (req, res) => {

    const { username, password, bio } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    const sql = `
        INSERT INTO users (username, password, bio)
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [username.trim(), password, bio || ""],
        function (error) {

            if (error) {
                return res.status(400).json({
                    message: "Username already exists"
                });
            }

            res.json({
                message: "Registration successful",
                userId: this.lastID
            });
        }
    );
});

// ================= LOGIN =================

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    const sql = `
        SELECT id, username, bio
        FROM users
        WHERE username = ? AND password = ?
    `;

    db.get(
        sql,
        [username.trim(), password],
        (error, user) => {

            if (error) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }

            res.json(user);
        }
    );
});

// ================= GET ALL USERS =================

app.get("/api/users", (req, res) => {

    db.all(
        `SELECT id, username, bio FROM users`,
        [],
        (error, users) => {

            if (error) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(users);
        }
    );
});

// ================= CREATE POST =================

app.post("/api/posts", (req, res) => {

    const { user_id, content } = req.body;

    if (!user_id || !content || !content.trim()) {
        return res.status(400).json({
            message: "Post content is required"
        });
    }

    const sql = `
        INSERT INTO posts (user_id, content)
        VALUES (?, ?)
    `;

    db.run(
        sql,
        [user_id, content.trim()],
        function (error) {

            if (error) {
                return res.status(500).json({
                    message: "Could not create post"
                });
            }

            res.json({
                message: "Post created successfully",
                postId: this.lastID
            });
        }
    );
});

// ================= GET POSTS =================

app.get("/api/posts", (req, res) => {

    const sql = `
        SELECT
            posts.id,
            posts.content,
            posts.likes,
            posts.created_at,
            users.id AS user_id,
            users.username
        FROM posts
        INNER JOIN users
        ON posts.user_id = users.id
        ORDER BY posts.id DESC
    `;

    db.all(sql, [], (error, posts) => {

        if (error) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(posts);
    });
});

// ================= LIKE POST =================

app.post("/api/posts/:id/like", (req, res) => {

    const postId = req.params.id;

    db.run(
        `
        UPDATE posts
        SET likes = likes + 1
        WHERE id = ?
        `,
        [postId],
        function (error) {

            if (error) {
                return res.status(500).json({
                    message: "Could not like post"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Post not found"
                });
            }

            res.json({
                message: "Post liked"
            });
        }
    );
});

// ================= ADD COMMENT =================

app.post("/api/comments", (req, res) => {

    const { post_id, user_id, comment } = req.body;

    if (!post_id || !user_id || !comment || !comment.trim()) {
        return res.status(400).json({
            message: "Comment is required"
        });
    }

    const sql = `
        INSERT INTO comments
        (post_id, user_id, comment)
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [post_id, user_id, comment.trim()],
        function (error) {

            if (error) {
                return res.status(500).json({
                    message: "Could not add comment"
                });
            }

            res.json({
                message: "Comment added successfully"
            });
        }
    );
});

// ================= GET COMMENTS =================

app.get("/api/comments/:postId", (req, res) => {

    const sql = `
        SELECT
            comments.id,
            comments.comment,
            comments.created_at,
            users.username
        FROM comments
        INNER JOIN users
        ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.id ASC
    `;

    db.all(
        sql,
        [req.params.postId],
        (error, comments) => {

            if (error) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(comments);
        }
    );
});

// ================= FOLLOW USER =================

app.post("/api/follow", (req, res) => {

    const { follower_id, following_id } = req.body;

    if (!follower_id || !following_id) {
        return res.status(400).json({
            message: "User information is required"
        });
    }

    if (Number(follower_id) === Number(following_id)) {
        return res.status(400).json({
            message: "You cannot follow yourself"
        });
    }

    const sql = `
        INSERT INTO followers
        (follower_id, following_id)
        VALUES (?, ?)
    `;

    db.run(
        sql,
        [follower_id, following_id],
        function (error) {

            if (error) {
                return res.status(400).json({
                    message: "Already following this user"
                });
            }

            res.json({
                message: "User followed successfully"
            });
        }
    );
});

// ================= GET FOLLOWERS COUNT =================

app.get("/api/followers/:userId", (req, res) => {

    db.get(
        `
        SELECT COUNT(*) AS count
        FROM followers
        WHERE following_id = ?
        `,
        [req.params.userId],
        (error, result) => {

            if (error) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(result);
        }
    );
});


// ================= START SERVER =================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("======================================");
    console.log("       ConnectHub is running!");
    console.log("======================================");
    console.log(`Server running on port ${PORT}`);
    console.log("======================================");
});