document.addEventListener('DOMContentLoaded', () => {
    // --- Mock Data ---
    const mockData = {
        instructors: [
            {
                id: 'i1',
                name: 'Roman Dewan',
                avatar: 'https://ui-avatars.com/api/?name=Roman+Dewan&background=f0f0f0&color=333',
                lastTime: '10:30',
                messages: [
                    { text: 'Hi.', sentByMe: false, time: '30 mins ago' },
                    { text: 'Hello.', sentByMe: true, time: '25 mins ago' },
                    { text: 'How are you?', sentByMe: false, time: '20 mins ago' }
                ]
            },
            {
                id: 'i2',
                name: 'Rifat Hasan',
                avatar: 'https://ui-avatars.com/api/?name=Rifat+Hasan&background=f0f0f0&color=333',
                lastTime: '09:30',
                messages: [
                    { text: 'Did you check the new assignment?', sentByMe: false, time: '1 hr ago' },
                    { text: 'Yes, just downloaded it.', sentByMe: true, time: '45 mins ago' }
                ]
            },
            {
                id: 'i3',
                name: 'Akash',
                avatar: 'https://ui-avatars.com/api/?name=Akash&background=f0f0f0&color=333',
                lastTime: '07:00',
                messages: [
                    { text: 'Please review my draft.', sentByMe: true, time: '2 hrs ago' },
                    { text: 'Sure, give me a moment.', sentByMe: false, time: '1 hr ago' }
                ]
            },
            {
                id: 'i4',
                name: 'Rashid',
                avatar: 'https://ui-avatars.com/api/?name=Rashid&background=f0f0f0&color=333',
                lastTime: '04:30',
                messages: []
            }
        ],
        batches: [
            {
                id: 'b1',
                name: 'Batch 2024 - A',
                avatar: 'https://ui-avatars.com/api/?name=Batch+A&background=8C82FE&color=fff',
                lastTime: 'Yesterday',
                messages: [
                    { text: 'Is the class tomorrow?', sentByMe: false, time: 'Yesterday' },
                    { text: 'Yes, at 10 AM.', sentByMe: true, time: 'Yesterday' }
                ]
            },
            {
                id: 'b2',
                name: 'Batch 2024 - B',
                avatar: 'https://ui-avatars.com/api/?name=Batch+B&background=FF5A96&color=fff',
                lastTime: 'Mon',
                messages: [
                    { text: 'Notes have been uploaded.', sentByMe: true, time: 'Mon' }
                ]
            }
        ]
    };

    // --- Modal Global Mock Data ---
    const globalInstructors = [
        { id: 'gi1', name: 'Dr. Sarah Connor', avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=eee&color=333', requestSent: false },
        { id: 'gi2', name: 'Prof. Alan Turing', avatar: 'https://ui-avatars.com/api/?name=Alan+Turing&background=eee&color=333', requestSent: false },
        { id: 'gi3', name: 'Emily Chen', avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=eee&color=333', requestSent: true },
        { id: 'gi4', name: 'Dr. Bruce Banner', avatar: 'https://ui-avatars.com/api/?name=Bruce+Banner&background=eee&color=333', requestSent: false }
    ];

    const globalMembers = [
        { id: 'gm1', name: 'Alice Smith', avatar: 'https://ui-avatars.com/api/?name=Alice+Smith&background=f0f0f0&color=333' },
        { id: 'gm2', name: 'Bob Johnson', avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=f0f0f0&color=333' },
        { id: 'gm3', name: 'Charlie Brown', avatar: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=f0f0f0&color=333' },
        { id: 'gm4', name: 'David Lee', avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=f0f0f0&color=333' },
        { id: 'gm5', name: 'Eve Carter', avatar: 'https://ui-avatars.com/api/?name=Eve+Carter&background=f0f0f0&color=333' }
    ];

    // --- State ---
    let currentTab = 'instructors';
    let activeUserId = mockData.instructors[0].id;
    let searchQuery = '';
    let selectedGroupMembers = [];

    // --- DOM Elements ---
    const userListEl = document.getElementById('user-list');
    const tabInstructorsBtn = document.getElementById('tab-instructors');
    const tabBatchesBtn = document.getElementById('tab-batches');
    const searchInput = document.getElementById('chat-search-input');
    
    const headerAvatar = document.getElementById('chat-header-avatar');
    const headerName = document.getElementById('chat-header-name');
    const messagesBox = document.getElementById('messages-box');
    
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('message-send-btn');
    const fabButton = document.getElementById('fab-new-chat');

    // Modal DOM Elements
    const chatModalOverlay = document.getElementById('chat-modal-overlay');
    const modalInstructor = document.getElementById('modal-instructor');
    const modalBatch = document.getElementById('modal-batch');
    const closeButtons = document.querySelectorAll('.close-modal');

    const modalInstSearch = document.getElementById('modal-instructor-search');
    const modalInstList = document.getElementById('modal-instructor-list');
    
    const modalBatchName = document.getElementById('modal-batch-name');
    const modalBatchSearch = document.getElementById('modal-batch-search');
    const modalBatchList = document.getElementById('modal-batch-list');
    const btnCreateGroup = document.getElementById('btn-create-group');

    // Make sure we have the correct user avatar based on our login status (Mock format for UI Avatar)
    const meAvatar = 'https://ui-avatars.com/api/?name=Me&background=41D185&color=fff';

    // --- Functions ---
    function renderUserList() {
        userListEl.innerHTML = '';
        const list = mockData[currentTab].filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (list.length === 0) {
            userListEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No contacts found</div>';
            return;
        }

        list.forEach(user => {
            const isActive = user.id === activeUserId;
            const item = document.createElement('div');
            item.className = `user-item ${isActive ? 'active' : ''}`;
            item.onclick = () => selectUser(user.id);

            item.innerHTML = `
                <div class="user-info-left">
                    <img src="${user.avatar}" class="user-avatar" alt="${user.name}">
                    <span class="user-name">${user.name}</span>
                </div>
                <span class="user-time">${user.lastTime}</span>
            `;
            userListEl.appendChild(item);
        });
    }

    function renderMessages() {
        // Find active user data
        let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
        
        if (!user) {
            messagesBox.innerHTML = '<div style="text-align:center; padding: 50px; color:#999;">Select a contact to view messages.</div>';
            headerName.textContent = 'Select Contact';
            headerAvatar.src = 'https://ui-avatars.com/api/?name=?&background=ddd&color=fff';
            return;
        }

        // Update Header
        headerName.textContent = user.name;
        headerAvatar.src = user.avatar;

        // Render Messages
        messagesBox.innerHTML = '';
        
        if (user.messages.length === 0) {
            messagesBox.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999; font-size:14px;">No messages yet. Say hi!</div>';
            return;
        }

        user.messages.forEach(msg => {
            const container = document.createElement('div');
            container.className = `msg-container ${msg.sentByMe ? 'sent' : 'received'}`;
            
            if (msg.sentByMe) {
                container.innerHTML = `
                    <i class="fa-solid fa-ellipsis msg-menu"></i>
                    <div class="msg-content-wrapper">
                        <div class="msg-bubble"><p>${msg.text}</p></div>
                        <span class="msg-time">${msg.time}</span>
                    </div>
                    <img src="${meAvatar}" class="msg-avatar" alt="Me">
                `;
            } else {
                container.innerHTML = `
                    <img src="${user.avatar}" class="msg-avatar" alt="${user.name}">
                    <div class="msg-content-wrapper">
                        <div class="msg-bubble"><p>${msg.text}</p></div>
                        <span class="msg-time">${msg.time}</span>
                    </div>
                    <i class="fa-solid fa-ellipsis msg-menu"></i>
                `;
            }
            messagesBox.appendChild(container);
        });

        // Scroll to bottom
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function selectUser(userId) {
        activeUserId = userId;
        renderUserList(); // update active state in list
        renderMessages();
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;
        if (!activeUserId) return;

        let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
        if (!user) return;

        // Add user msg to mock data
        user.messages.push({
            text: text,
            sentByMe: true,
            time: 'Just now'
        });

        messageInput.value = '';
        renderMessages();

        // Bot Auto-reply (mock behavior)
        setTimeout(() => {
            const botReplies = [
                "That sounds good!", 
                "Yes, perfectly.", 
                "Let me check on that and get back to you.", 
                "Understood.", 
                "Could you clarify?"
            ];
            const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
            
            user.messages.push({
                text: randomReply,
                sentByMe: false,
                time: 'Just now'
            });
            user.lastTime = 'Now';
            
            if (user.id === activeUserId) renderMessages();
            renderUserList();
        }, 1500); // 1.5 seconds delay
    }

    // --- Modal Functions ---
    function openModal(type) {
        chatModalOverlay.style.display = 'flex';
        modalInstructor.style.display = 'none';
        modalBatch.style.display = 'none';

        if (type === 'instructors') {
            modalInstructor.style.display = 'flex';
            modalInstSearch.value = '';
            renderInstructorModalList('');
        } else if (type === 'batches') {
            modalBatch.style.display = 'flex';
            selectedGroupMembers = []; // reset state
            modalBatchName.value = '';
            modalBatchSearch.value = '';
            renderBatchModalList('');
        }
    }

    function closeModal() {
        chatModalOverlay.style.display = 'none';
    }

    function renderInstructorModalList(query) {
        modalInstList.innerHTML = '';
        const list = globalInstructors.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        
        list.forEach(user => {
            const item = document.createElement('div');
            item.className = 'modal-list-item';
            
            const btnClass = user.requestSent ? 'btn-request sent' : 'btn-request';
            const btnText = user.requestSent ? 'Request Sent' : 'Send Request';

            item.innerHTML = `
                <div class="user-info-left">
                    <img src="${user.avatar}" class="user-avatar" alt="${user.name}">
                    <span class="user-name">${user.name}</span>
                </div>
                <button class="action-btn ${btnClass}" data-id="${user.id}">${btnText}</button>
            `;
            
            item.querySelector('button').addEventListener('click', (e) => {
                if (user.requestSent) return;
                
                // Simulate request sending logic
                user.requestSent = true;
                e.target.className = 'action-btn btn-request sent';
                e.target.textContent = 'Request Sent';

                // Automatically accept Mock feature to show side panel connection:
                setTimeout(() => {
                    alert(`${user.name} accepted your request! They have been added to your contact list.`);
                    mockData.instructors.unshift({
                        id: user.id + '_active',
                        name: user.name,
                        avatar: user.avatar,
                        lastTime: 'Just now',
                        messages: []
                    });
                    if (currentTab === 'instructors') {
                        // Optionally set them as active
                        activeUserId = user.id + '_active';
                        renderUserList();
                        renderMessages();
                    }
                }, 1500);
            });

            modalInstList.appendChild(item);
        });
    }

    function renderBatchModalList(query) {
        modalBatchList.innerHTML = '';
        const list = globalMembers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        
        list.forEach(user => {
            const isSelected = selectedGroupMembers.includes(user.id);
            const item = document.createElement('div');
            item.className = `modal-list-item ${isSelected ? 'selected' : ''}`;
            
            item.innerHTML = `
                <div class="user-info-left">
                    <img src="${user.avatar}" class="user-avatar" alt="${user.name}">
                    <span class="user-name">${user.name}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                if (isSelected) {
                    selectedGroupMembers = selectedGroupMembers.filter(id => id !== user.id);
                } else {
                    selectedGroupMembers.push(user.id);
                }
                renderBatchModalList(modalBatchSearch.value); // Re-render to update toggle state
            });

            modalBatchList.appendChild(item);
        });
    }

    // --- Event Listeners ---
    tabInstructorsBtn.addEventListener('click', () => {
        currentTab = 'instructors';
        tabInstructorsBtn.classList.add('active');
        tabBatchesBtn.classList.remove('active');
        
        if(mockData.instructors.length > 0) activeUserId = mockData.instructors[0].id;
        else activeUserId = null;
        
        renderUserList();
        renderMessages();
    });

    tabBatchesBtn.addEventListener('click', () => {
        currentTab = 'batches';
        tabBatchesBtn.classList.add('active');
        tabInstructorsBtn.classList.remove('active');
        
        if(mockData.batches.length > 0) activeUserId = mockData.batches[0].id;
        else activeUserId = null;
        
        renderUserList();
        renderMessages();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderUserList();
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // FAB Button Modal Logic
    fabButton.addEventListener('click', () => openModal(currentTab));

    // Modal Close Logic
    closeButtons.forEach(btn => btn.addEventListener('click', closeModal));
    chatModalOverlay.addEventListener('click', (e) => {
        if (e.target === chatModalOverlay) closeModal();
    });

    // Modal Input Listeners
    modalInstSearch.addEventListener('input', (e) => renderInstructorModalList(e.target.value));
    modalBatchSearch.addEventListener('input', (e) => renderBatchModalList(e.target.value));

    // Create Group Logic
    btnCreateGroup.addEventListener('click', () => {
        const groupName = modalBatchName.value.trim();
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }
        if (selectedGroupMembers.length === 0) {
            alert('Please select at least one member');
            return;
        }

        const newBatchId = 'b' + Date.now();
        mockData.batches.unshift({
            id: newBatchId,
            name: groupName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random&color=fff`,
            lastTime: 'Just now',
            messages: []
        });

        closeModal();
        
        if (currentTab === 'batches') {
            activeUserId = newBatchId; // Switch focus to the new group
            renderUserList();
            renderMessages();
        }
    });

    // Mock click actions for buttons that don't have underlying functionality
    const alertMock = (actionName) => alert(`Action recognized: ${actionName}`);
    
    document.getElementById('action-phone').addEventListener('click', () => alertMock('Audio Call'));
    document.getElementById('action-video').addEventListener('click', () => alertMock('Video Call'));
    document.getElementById('action-menu').addEventListener('click', () => alertMock('Chat Options'));
    document.getElementById('action-attach').addEventListener('click', () => alertMock('Attachment Menu'));
    document.getElementById('action-emoji').addEventListener('click', () => alertMock('Emoji Picker'));

    // --- Main Initial Render ---
    renderUserList();
    renderMessages();
});
