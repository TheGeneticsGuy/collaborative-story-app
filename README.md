# Overview

[Click here for LIVE deployment of the Collaborative Storytelling App](https://collaborative-story-app.onrender.com)

This goal of this project was to build a real-time, interactive web application, specifically Node.js and Socket.IO, coupled with a cloud-based NoSQL database. The aim was to build a platform where users can collaboratively write a story together and have those collaborations happen on the fly. Essentially, this serves as a practical demonstration of the implementation of a full-stack JavaScript, real-time communication, and cloud database application.

It goes beyond just a simple board or forum of entries per person, but a way to view the final result by clicking the "View Story" button and allowing the program to append all of the entries into a final storytelling result. Full CRUD implementation with the ability to Create story snippets, Read them, Update them (edit), as well as Delete them.

Furthermore, an additional purpose in developing this was to gain more experience with the MERN stack (MongoDB, Express.js, React/EJS, Node.js), which is basically a branch off of what I learned in CSE 340, integrating it into the project-driven CSE 310 course. I wanted to understand how to structure an application that supports concurrent user interactions and data synchronization, which is something I had not done "live" before, yet is basically the norm in most modern web services. I was able to work with session management, WebSocket communication, and asynchronous database operations. Really cool stuff!

[Software Demo](https://youtu.be/b8U_QSqEGJ8)

# Cloud Database

This application utilizes **MongoDB Atlas**, a fully managed, cloud-hosted NoSQL database service. MongoDB was chosen for the ease of development.

The database, named `collaborativeStoryApp`, consists of the following main collections:

*   **`users`**: Stores user authentication information.
    *   `username`: (String, unique, required) - The user's chosen username.
    *   `password`: (String, required) - Hashed password for security.
    *   `createdAt`, `updatedAt`: (Timestamps) - Automatically managed by Mongoose.
*   **`stories`**: Represents the main story entities.
    *   `title`: (String, required) - The title of the story.
    *   `author`: (ObjectId, ref: 'User', required) - The user who initially created the story.
    *   `snippets`: (Array of ObjectId, ref: 'Snippet') - A list of all snippets (collaborative entries) that form the story.
    *   `createdAt`, `updatedAt`: (Timestamps).
*   **`snippets`**: Contains individual contributions to stories.
    *   `content`: (String, required) - The text content of the snippet.
    *   `author`: (ObjectId, ref: 'User', required) - The user who wrote this snippet.
    *   `story`: (ObjectId, ref: 'Story', required) - A reference to the story this snippet belongs to.
    *   `createdAt`, `updatedAt`: (Timestamps).

This structure allows for efficient querying of stories, their snippets, and associated authors. There is a relational nature between the stories and snippets.

# Development Environment

*   **Node.js:** As the JavaScript runtime environment for the backend.
*   **Express.js:** Node.js application framework used for routing, middleware, and handling HTTP requests.
*   **MongoDB Atlas:** The cloud-hosted NoSQL database.
*   **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js, used to define schemas and interact with the database.
*   **Socket.IO:** A JS library enabling real-time, bidirectional, communication between web-clients/servers (CRITICAL for live collab)
*   **EJS (Embedded JavaScript templating):** A templating language used to generate HTML markup with Javascript
*   **bcryptjs:** For hashing user passwords before storing them in the database.
*   **express-session & connect-mongo:** For managing user sessions and persisting them in MongoDB.
*   **Git & GitHub:** For version control and source code management.
*   **Render.com:** For deploying the website and hosting the server

# Useful Websites

- [Socket.IO Documentation](https://socket.io/docs/v4/) - Key resource for implementing real-time LIVE updates and event listening.
- [Stack Overflow](https://stackoverflow.com/) - For troubleshooting specific coding challenges - used this on color-coding names automatically
- [Salt and Has p/w with bcrypt](https://heynode.com/blog/2020-04/salt-and-hash-passwords-bcrypt/) - Guide for bcrypt integration for custom user authentication

# Future Work

*   **Enhanced Real-time Editing Indicators:** Show "User X is typing..." or highlight snippets currently being edited by others.
*   **More Specific Permissions:** Implement roles ( story owner, editor, viewer) or private stories with invite-only collaboration.
*   **Notifications:** Alert users to new contributions in stories they follow or are participating in beyond just the LIVE notifications/updates.