let currentUser = null;


// ================= REGISTER =================

async function register() {

    const username =
        document.getElementById("registerUsername").value.trim();

    const password =
        document.getElementById("registerPassword").value.trim();

    const bio =
        document.getElementById("registerBio").value.trim();


    if (!username || !password) {

        alert("Please enter username and password.");

        return;
    }


    try {

        const response = await fetch("/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password,
                bio: bio
            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        alert("Registration successful!");

        document.getElementById("registerUsername").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("registerBio").value = "";

        showLogin();

    }

    catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }
}


// ================= LOGIN =================

async function login() {

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value.trim();


    if (!username || !password) {

        alert("Please enter username and password.");

        return;
    }


    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        currentUser = data;
        localStorage.setItem("connectHubUser", JSON.stringify(currentUser));


        document
            .getElementById("loginSection")
            .classList.add("hidden");


        document
            .getElementById("registerSection")
            .classList.add("hidden");


        document
            .getElementById("mainApp")
            .classList.remove("hidden");


        document
            .getElementById("navigation")
            .classList.remove("hidden");


        showHome();

    }

    catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }
}


// ================= LOGOUT =================

function logout() {

    currentUser = null;

    document
        .getElementById("mainApp")
        .classList.add("hidden");

    document
        .getElementById("navigation")
        .classList.add("hidden");

    document
        .getElementById("loginUsername")
        .value = "";

    document
        .getElementById("loginPassword")
        .value = "";

    showLogin();
}


// ================= SHOW LOGIN =================

function showLogin() {

    document
        .getElementById("loginSection")
        .classList.remove("hidden");

    document
        .getElementById("registerSection")
        .classList.add("hidden");
}


// ================= SHOW REGISTER =================

function showRegister() {

    document
        .getElementById("loginSection")
        .classList.add("hidden");

    document
        .getElementById("registerSection")
        .classList.remove("hidden");
}


// ================= CREATE POST =================

async function createPost() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const content =
        document.getElementById("postContent").value.trim();


    if (!content) {

        alert("Please write something.");

        return;
    }


    try {

        const response = await fetch("/api/posts", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                user_id: currentUser.id,

                content: content

            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        document
            .getElementById("postContent")
            .value = "";


        loadPosts();

    }

    catch (error) {

        console.error(error);

        alert("Could not create post.");

    }
}


// ================= LOAD POSTS =================

async function loadPosts() {

    try {

        const response =
            await fetch("/api/posts");


        const posts =
            await response.json();


        const container =
            document.getElementById("postsContainer");


        container.innerHTML = "";


        if (posts.length === 0) {

            container.innerHTML = `
                <div class="post">
                    <p>No posts yet.</p>
                    <p>Create the first post!</p>
                </div>
            `;

            return;
        }


        posts.forEach(post => {

            const postElement =
                document.createElement("div");


            postElement.className = "post";


            const date =
                new Date(post.created_at).toLocaleString();


            postElement.innerHTML = `

                <div class="post-header">

                    <span class="username">
                        @${escapeHTML(post.username)}
                    </span>

                    <span class="post-date">
                        ${date}
                    </span>

                </div>


                <div class="post-content">
                    ${escapeHTML(post.content)}
                </div>


                <div class="post-actions">

                    <button onclick="likePost(${post.id})">
                        ❤️ Like (${post.likes})
                    </button>

                    <button onclick="loadComments(${post.id})">
                        💬 Comments
                    </button>

                </div>


                <div
                    id="comments-${post.id}"
                    class="comments">
                </div>


                <div class="comment-box">

                    <input
                        type="text"
                        id="comment-${post.id}"
                        placeholder="Write a comment..."
                    >

                    <button onclick="addComment(${post.id})">
                        Send
                    </button>

                </div>

            `;


            container.appendChild(postElement);

        });

    }

    catch (error) {

        console.error(error);

    }
}


// ================= LIKE =================

async function likePost(postId) {

    try {

        const response =
            await fetch(`/api/posts/${postId}/like`, {
                method: "POST"
            });


        if (!response.ok) {

            alert("Could not like post.");

            return;
        }


        loadPosts();

    }

    catch (error) {

        console.error(error);

    }
}


// ================= ADD COMMENT =================

async function addComment(postId) {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    const input =
        document.getElementById(`comment-${postId}`);


    const comment =
        input.value.trim();


    if (!comment) {

        alert("Please write a comment.");

        return;
    }


    try {

        const response =
            await fetch("/api/comments", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    post_id: postId,

                    user_id: currentUser.id,

                    comment: comment

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;
        }


        input.value = "";

        loadComments(postId);

    }

    catch (error) {

        console.error(error);

    }
}


// ================= LOAD COMMENTS =================

async function loadComments(postId) {

    try {

        const response =
            await fetch(`/api/comments/${postId}`);


        const comments =
            await response.json();


        const container =
            document.getElementById(`comments-${postId}`);


        container.innerHTML = "";


        if (comments.length === 0) {

            container.innerHTML =
                "<p>No comments yet.</p>";

            return;
        }


        comments.forEach(item => {

            const div =
                document.createElement("div");


            div.className = "comment";


            div.innerHTML = `
                <b>@${escapeHTML(item.username)}</b>
                ${escapeHTML(item.comment)}
            `;


            container.appendChild(div);

        });

    }

    catch (error) {

        console.error(error);

    }
}


// ================= SHOW USERS =================

async function showUsers() {

    hideSections();

    document
        .getElementById("users")
        .classList.remove("hidden");


    try {

        const response =
            await fetch("/api/users");


        const users =
            await response.json();


        const container =
            document.getElementById("usersContainer");


        container.innerHTML = "";


        users.forEach(user => {

            if (user.id === currentUser.id) {
                return;
            }


            const div =
                document.createElement("div");


            div.className = "user-card";


            div.innerHTML = `

                <div>

                    <strong>
                        @${escapeHTML(user.username)}
                    </strong>

                    <p>
                        ${escapeHTML(
                            user.bio || "No bio available"
                        )}
                    </p>

                </div>


                <button onclick="followUser(${user.id})">
                    Follow
                </button>

            `;


            container.appendChild(div);

        });


        if (container.innerHTML === "") {

            container.innerHTML =
                "<div class='post'><p>No other users available.</p></div>";

        }

    }

    catch (error) {

        console.error(error);

    }
}


// ================= FOLLOW =================

async function followUser(userId) {

    try {

        const response =
            await fetch("/api/follow", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    follower_id: currentUser.id,

                    following_id: userId

                })

            });


        const data =
            await response.json();


        alert(data.message);

    }

    catch (error) {

        console.error(error);

        alert("Could not follow user.");

    }
}


// ================= PROFILE =================

async function showProfile() {

    hideSections();

    document
        .getElementById("profile")
        .classList.remove("hidden");

    document.getElementById("profileUsername").textContent =
        "@" + currentUser.username;

    document.getElementById("profileBio").textContent =
        currentUser.bio || "No bio added yet.";

    try {

        const response =
            await fetch(`/api/followers/${currentUser.id}`);

        const data =
            await response.json();

        document.getElementById("followerCount").textContent =
            data.count;

    } catch (error) {

        console.error(error);

    }
}



// ================= HOME =================

function showHome() {

    hideSections();


    document
        .getElementById("home")
        .classList.remove("hidden");


    loadPosts();
    loadUsers();

}


// ================= HIDE SECTIONS =================

function hideSections() {

    document
        .getElementById("home")
        .classList.add("hidden");


    document
        .getElementById("users")
        .classList.add("hidden");


    document
        .getElementById("profile")
        .classList.add("hidden");

}


// ================= ESCAPE HTML =================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}



// ================= CHECK LOGIN =================

// ================= CHECK LOGIN =================

window.addEventListener("load", () => {

    const savedUser = localStorage.getItem("connectHubUser");

    if (savedUser) {

        currentUser = JSON.parse(savedUser);

        document.getElementById("mainApp").classList.remove("hidden");

        document.getElementById("loginSection").classList.add("hidden");

        document.getElementById("registerSection").classList.add("hidden");

        document.getElementById("navigation").classList.remove("hidden");

        showHome();

    } else {

        document.getElementById("mainApp").classList.add("hidden");

        document.getElementById("loginSection").classList.remove("hidden");

        document.getElementById("registerSection").classList.add("hidden");
    }

});



function logout() {
    localStorage.removeItem("connectHubUser");
    location.reload();
}




async function loadUsers() {
    try {
        const response = await fetch("/api/users");
        const users = await response.json();

        const container = document.getElementById("usersContainer");
        container.innerHTML = "";

        users.forEach(user => {
            if (user.id === currentUser.id) {
                return;
            }

            const div = document.createElement("div");

            div.className = "user-card";

            div.innerHTML = `
                <div>
                    <h3>@${escapeHTML(user.username)}</h3>
                    <p>${escapeHTML(user.bio || "No bio available")}</p>
                </div>

                <button onclick="followUser(${user.id})">
                    Follow
                </button>
            `;

            container.appendChild(div);
        });

    } catch (error) {
        console.error(error);
    }
}
