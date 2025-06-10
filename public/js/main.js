// I want each person to be able to have a different color as they type
// This ensures dark colors against the white background (neat trick I found on Stack overflow)
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }

    return color;
}

document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // Initializing Socket.IO for the bidirectional event-drive communication needed for this to work!

    // Let's check if we are on the story detail page first. I was getting some error here by being on wrong page.
    const storyDetailPage = document.querySelector('.story-detail-page');

    if (storyDetailPage) {

        document.querySelectorAll('.author-name[data-author-username]').forEach(span => {
            const username = span.dataset.authorUsername;
            if (username && username !== 'Contributor') {
                span.style.color = stringToColor(username);
            }
        });

        const storyId = storyDetailPage.dataset.storyId;

        if (storyId) {
            // socket.emit creates an event on the server to trigger that someone joined the room (LIVE UPDATE)
            socket.emit('join_story_room', storyId);
            console.log(`Client attempting to join room for story ID: ${storyId}`);
        }

        // Listen for 'new_snippet' events from the server
        socket.on('new_snippet', (snippet) => {
            console.log('Received new snippet:', snippet);

            const snippetsContainer = document.getElementById('snippets-container');
            const noSnippetsMessage = document.getElementById('no-snippets-message');

            // Need to remove the "no snippets" message if it exists
            if (noSnippetsMessage) {
                noSnippetsMessage.remove();
            }

            // Ok snippet found - let's create the new snippet!
            const snippetElement = document.createElement('div');
            snippetElement.classList.add('snippet');
            snippetElement.id = `snippet-${snippet._id}`;

            const contentP = document.createElement('p');
            contentP.classList.add('snippet-content');
            contentP.textContent = snippet.content; // SPECIFICALY using textContent to prevent nefarious inputs possible with innerHTML
            // I think it's called cross-site scripting

            const metaP = document.createElement('p');
            metaP.classList.add('snippet-meta');

            const authorUsername = snippet.author ? snippet.author.username : 'Contributor';
            const authorColor = snippet.author ? stringToColor(snippet.author.username) : '#000000';

            metaP.innerHTML = `<em>By:
                <span class="author-name" style="color: ${authorColor};">
                    ${authorUsername}
                </span>
                on ${new Date(snippet.createdAt).toLocaleString()}</em>`;

            snippetElement.appendChild(contentP);
            snippetElement.appendChild(metaP);

            // Append the new snippet to the container
            if (snippetsContainer) {
                snippetsContainer.appendChild(snippetElement);
                // Auto-Scroll to new snippet...
                // snippetElement.scrollIntoView({ behavior: 'smooth', block: 'end' }); -- I added this but it ended up being kind of annoying on implementation... Trying to think of re-introducing it better somehow.
            } else {
                console.error('Snippets container not found!');
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket failing to connect:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // the disconextion was forced by server due to error.
                socket.connect();
            }
        });
    }
});
