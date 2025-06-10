const addSnippetForm = document.querySelector('.add-snippet-form form');
const contentTextarea = document.getElementById('content');
const formSubmitButton = addSnippetForm ? addSnippetForm.querySelector('button[type="submit"]') : null;
const formH3 = addSnippetForm ? addSnippetForm.querySelector('h3') : null;

// To keep track of the snippet being modified
let editingSnippetId = null;


// I want each person to be able to have a different color as they type
// This ensures dark colors against the white background (neat trick I found on Stack overflow)
function stringToColor(str) {
    if (!str) return '#000000';
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
        const storyId = storyDetailPage.dataset.storyId;

        // Color existing author names
        document.querySelectorAll('.author-name[data-author-username]').forEach(span => {
            const username = span.dataset.authorUsername;
            if (username && username !== 'Contributor') {
                span.style.color = stringToColor(username);
            }
        });

        if (storyId) {
            // socket.emit creates an event on the server to trigger that someone joined the room (LIVE UPDATE)
            socket.emit('join_story_room', storyId);
            console.log(`Client attempting to join room for story ID: ${storyId}`);
        }

        // Event Listener for Edit and Delete buttons
        const snippetsContainer = document.getElementById('snippets-container');
        if (snippetsContainer) {
            snippetsContainer.addEventListener('click', async (event) => {
                const target = event.target;

                // EDIT button click
                if (target.classList.contains('btn-edit-snippet')) {
                    editingSnippetId = target.dataset.snippetId;
                    const snippetElement = document.getElementById(`snippet-${editingSnippetId}`);

                    if (snippetElement && snippetElement.dataset.snippetContent) {
                        const currentContent = snippetElement.dataset.snippetContent;

                        if(contentTextarea) contentTextarea.value = currentContent;
                        if (formH3) formH3.textContent = 'Edit Your Contribution';
                        if (formSubmitButton) formSubmitButton.textContent = 'Save Changes';

                        if(addSnippetForm) addSnippetForm.scrollIntoView({ behavior: 'smooth' });
                        if(contentTextarea) contentTextarea.focus();
                    } else {
                        console.error('Could not find story snippet content for editing.');
                        editingSnippetId = null; // Reset if content not found
                    }
                }

                // DELETE button click
                if (target.classList.contains('btn-delete-snippet')) {
                    const snippetIdToDelete = target.dataset.snippetId;
                    if (confirm('Are you sure you want to delete this story snippet?')) {
                        try {
                            const response = await fetch(`/stories/${storyId}/snippets/${snippetIdToDelete}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });
                            if (response.ok) {
                                console.log('Delete request successful, waiting to remove story snippet.');
                            } else {
                                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                                alert(`Error deleting snippet: ${errorData.message || response.statusText}`);
                            }
                        } catch (error) {
                            console.error('Failed to delete story snippet:', error);
                            alert('Failed to delete story snippet. Check console for details.');
                        }
                    }
                }
            });
        }
        // Main submission form will differ if in new or edit mode.
        if (addSnippetForm) {
            addSnippetForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const content = contentTextarea ? contentTextarea.value.trim() : '';
                if (!content) {
                    alert('Content cannot be empty.');
                    return;
                }

                let url, method;

                if (editingSnippetId) {
                    // We are in EDIT mode
                    url = `/stories/${storyId}/snippets/${editingSnippetId}`;
                    method = 'PUT';
                } else {
                    // We are in ADD NEW mode
                    url = `/stories/${storyId}/snippets`;
                    method = 'POST';
                }

                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: content })
                    });

                    if (response.ok) {
                        if(contentTextarea) contentTextarea.value = '';
                        if (editingSnippetId) {
                            if (formH3) formH3.textContent = 'Add Your Contribution';
                            if (formSubmitButton) formSubmitButton.textContent = 'Add to Story';
                            editingSnippetId = null; // Clear editing state
                        }
                        console.log(`Snippet ${method === 'POST' ? 'added' : 'updated'} successfully, waiting for socket event.`);
                        // Snippet will be added/updated in DOM via Socket.IO
                    } else {
                        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                        alert(`Error: ${errorData.message || response.statusText}`);
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    alert('An error occurred. Please try again.');
                }
            });
        }

        // SOCKET.IO EVENT HANDLERS
        // Listen for 'new_snippet' events from the server
        socket.on('new_snippet', (snippet) => {
            console.log('Received new snippet:', snippet);

            const snippetsContainer = document.getElementById('snippets-container'); // Re-fetch in case it was removed
            const noSnippetsMessage = document.getElementById('no-snippets-message');

            // Need to remove the "no snippets" message if it exists
            if (noSnippetsMessage) {
                noSnippetsMessage.remove();
            }

            // Ok snippet found - let's create the new snippet!
            const snippetElement = document.createElement('div');
            snippetElement.classList.add('snippet');
            snippetElement.id = `snippet-${snippet._id}`;
            snippetElement.dataset.snippetContent = snippet.content;


            const contentP = document.createElement('p');
            contentP.classList.add('snippet-content');
            contentP.textContent = snippet.content; // SPECIFICALY using textContent to prevent nefarious inputs possible with innerHTML

            const metaP = document.createElement('p');
            metaP.classList.add('snippet-meta');

            const authorUsername = snippet.author ? snippet.author.username : 'Contributor';
            const authorColor = snippet.author ? stringToColor(authorUsername) : '#000000';

            // Dynamically add edit/delete buttons
            let actionsHTML = '';
            const currentUserIdMeta = document.querySelector('meta[name="current-user-id"]');
            const currentUserId = currentUserIdMeta ? currentUserIdMeta.content : null;

            if (currentUserId && snippet.author && snippet.author._id.toString() === currentUserId.toString()) {
                actionsHTML = `
                    <span class="snippet-actions">
                        <button class="btn-edit-snippet" data-snippet-id="${snippet._id}">Edit</button>
                        <button class="btn-delete-snippet" data-snippet-id="${snippet._id}">Delete</button>
                    </span>
                `;
            }

            metaP.innerHTML = `<em>By:
                <span class="author-name" style="color: ${authorColor};">
                    ${authorUsername}
                </span>
                on ${new Date(snippet.createdAt).toLocaleString()}</em>
                ${actionsHTML}`;

            snippetElement.appendChild(contentP);
            snippetElement.appendChild(metaP);

            if (snippetsContainer) {
                snippetsContainer.appendChild(snippetElement);
            } else {
                console.error('Snippets container not found when appending new snippet!');
            }
        });

        socket.on('snippet_updated', (updatedSnippet) => {
            console.log('Received snippet_updated:', updatedSnippet);
            const snippetElement = document.getElementById(`snippet-${updatedSnippet._id}`);
            if (snippetElement) {
                const contentP = snippetElement.querySelector('.snippet-content');
                if (contentP) contentP.textContent = updatedSnippet.content;
                snippetElement.dataset.snippetContent = updatedSnippet.content;

                // Update meta info
                const metaP = snippetElement.querySelector('.snippet-meta');
                if (metaP) {
                    const authorUsername = updatedSnippet.author ? updatedSnippet.author.username : 'Contributor';
                    const authorColor = updatedSnippet.author ? stringToColor(authorUsername) : '#000000';

                    const existingActions = metaP.querySelector('.snippet-actions');
                    let actionsHTML = existingActions ? existingActions.outerHTML : '';

                    metaP.innerHTML = `<em>By:
                        <span class="author-name" style="color: ${authorColor};">
                            ${authorUsername}
                        </span>
                        on ${new Date(updatedSnippet.updatedAt || updatedSnippet.createdAt).toLocaleString()}</em>
                        ${actionsHTML}`;
                }
            }
        });

        socket.on('snippet_deleted', (data) => {
            console.log('Received snippet_deleted:', data);
            const snippetElement = document.getElementById(`snippet-${data.snippetId}`);
            if (snippetElement) {
                snippetElement.remove();
            }
            // Check if snippets container is empty now and update mesaging
            const currentSnippets = snippetsContainer ? snippetsContainer.querySelectorAll('.snippet') : [];
            if (snippetsContainer && currentSnippets.length === 0 && !document.getElementById('no-snippets-message')) {
                 const noSnippetsMsg = document.createElement('p');
                 noSnippetsMsg.id = 'no-snippets-message';
                 noSnippetsMsg.textContent = 'No contributions yet. Be the first to add to the story!';
                 snippetsContainer.appendChild(noSnippetsMsg);
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket failing to connect:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });
    }
});