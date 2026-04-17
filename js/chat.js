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

    // --- Dropdowns & Popups Logic ---
    const headerDropdown = document.getElementById('header-dropdown');
    const attachDropdown = document.getElementById('attach-dropdown');
    const emojiPicker = document.getElementById('emoji-picker');
    const messageDropdown = document.getElementById('message-dropdown');
    
    const actionMenu = document.getElementById('action-menu');
    const actionAttach = document.getElementById('action-attach');
    const actionEmoji = document.getElementById('action-emoji');
    const headerUser = document.querySelector('.chat-header-user');
    const modalCall = document.getElementById('modal-call');
    const modalProfile = document.getElementById('modal-profile');
    const modalPinned = document.getElementById('modal-pinned');

    function closeAllDropdowns() {
        headerDropdown.style.display = 'none';
        attachDropdown.style.display = 'none';
        emojiPicker.style.display = 'none';
        messageDropdown.style.display = 'none';
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu') &&
            !e.target.closest('.emoji-picker') &&
            !e.target.classList.contains('msg-menu') &&
            e.target.id !== 'action-menu' &&
            e.target.id !== 'action-attach' &&
            e.target.id !== 'action-emoji') {
            closeAllDropdowns();
        }
    });

    actionMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const rect = actionMenu.getBoundingClientRect();
        headerDropdown.style.top = `${rect.bottom + 10}px`;
        headerDropdown.style.right = `${window.innerWidth - rect.right}px`;
        headerDropdown.style.display = 'block';
    });

    actionAttach.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const rect = actionAttach.getBoundingClientRect();
        attachDropdown.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        attachDropdown.style.left = `${rect.left}px`;
        attachDropdown.style.display = 'block';
    });

    actionEmoji.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const rect = actionEmoji.getBoundingClientRect();
        emojiPicker.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        emojiPicker.style.left = `${rect.left}px`;
        emojiPicker.style.display = 'grid';
    });

    emojiPicker.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            messageInput.value += e.target.textContent;
            messageInput.focus();
        }
    });

    // Message Menu Event Delegation
    let activeMessageElement = null;

    messagesBox.addEventListener('click', (e) => {
        if (e.target.classList.contains('msg-menu')) {
            e.stopPropagation();
            closeAllDropdowns();
            activeMessageElement = e.target.closest('.msg-container');
            const rect = e.target.getBoundingClientRect();
            messageDropdown.style.display = 'block';
            
            // Allow browser to calculate width by displaying first momentarily outside view if we wanted,
            // or just use approximate left positioning. Using right anchor is safer for sent msgs:
            if (activeMessageElement.classList.contains('sent')) {
                messageDropdown.style.top = `${rect.bottom}px`;
                messageDropdown.style.right = `${window.innerWidth - rect.left}px`;
                messageDropdown.style.left = 'auto';
            } else {
                messageDropdown.style.top = `${rect.bottom}px`;
                messageDropdown.style.left = `${rect.right}px`;
                messageDropdown.style.right = 'auto';
            }
        }
    });

    messageDropdown.addEventListener('click', (e) => {
        const action = e.target.closest('.dropdown-item');
        if (action && activeMessageElement) {
            const actionText = action.textContent.trim();
            const msgTextEl = activeMessageElement.querySelector('.msg-bubble p');
            const msgText = msgTextEl ? msgTextEl.textContent : '';

            if (actionText === 'Copy') {
                navigator.clipboard.writeText(msgText).then(() => {
                    console.log('Copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy', err);
                });
            } else if (actionText === 'Remove') {
                activeMessageElement.style.opacity = '0';
                setTimeout(() => {
                    activeMessageElement.remove();
                }, 300);
            } else if (actionText === 'Pin') {
                let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
                if (user) {
                    if (!user.pinnedMessages) user.pinnedMessages = [];
                    // add if not duplicate
                    if (!user.pinnedMessages.find(m => m.text === msgText)) {
                        user.pinnedMessages.push({ text: msgText, time: 'Just now' });
                    }
                    alert('Message pinned!');
                }
            } else if (actionText === 'Reply') {
                const hintText = "Replying to: " + (msgText.length > 20 ? msgText.substring(0, 20) + '...' : msgText);
                messageInput.value = hintText + " \n";
                messageInput.focus();
            } else if (actionText === 'Forward') {
                alert(`Forwarding message: "${msgText}"\n(Forward selection modal would open here)`);
            }
            
            closeAllDropdowns();
        }
    });

    // Profile Modal Logic
    headerUser.addEventListener('click', () => {
        let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
        if(user) {
            document.getElementById('profile-avatar').src = user.avatar;
            document.getElementById('profile-name').innerHTML = user.name;
            document.getElementById('profile-id').innerHTML = user.id;
            
            chatModalOverlay.style.display = 'flex';
            modalInstructor.style.display = 'none';
            modalBatch.style.display = 'none';
            modalCall.style.display = 'none';
            modalProfile.style.display = 'block';
        }
    });

    headerDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const actionText = item.textContent.trim();
        closeAllDropdowns();

        if (actionText === 'View Profile') {
            headerUser.click();
        } else if (actionText === 'Mute' || actionText === 'Unmute') {
            const icon = item.querySelector('i');
            if (icon.classList.contains('fa-bell-slash')) {
                icon.classList.replace('fa-bell-slash', 'fa-bell');
                item.innerHTML = '<i class="fa-regular fa-bell"></i> Unmute';
                alert('User notifications muted.');
            } else {
                icon.classList.replace('fa-bell', 'fa-bell-slash');
                item.innerHTML = '<i class="fa-regular fa-bell-slash"></i> Mute';
                alert('User notifications unmuted.');
            }
        } else if (actionText === 'View Pinned Messages') {
            let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
            if (user) {
                const pinnedList = document.getElementById('modal-pinned-list');
                pinnedList.innerHTML = '';
                if (!user.pinnedMessages || user.pinnedMessages.length === 0) {
                    pinnedList.innerHTML = '<div style="text-align:center; padding: 30px 20px; color:#999;">No pinned messages found.</div>';
                } else {
                    user.pinnedMessages.forEach(msg => {
                        const div = document.createElement('div');
                        div.className = 'modal-list-item';
                        div.style.flexDirection = 'column';
                        div.style.alignItems = 'flex-start';
                        div.style.gap = '8px';
                        div.innerHTML = `
                            <div style="background: #E5E7EB; padding: 10px 15px; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; color: var(--text-dark);">
                                ${msg.text}
                            </div>
                            <span style="font-size: 11px; color:#6B7280;"><i class="fa-solid fa-thumbtack"></i> Pinned ${msg.time}</span>
                        `;
                        pinnedList.appendChild(div);
                    });
                }
                chatModalOverlay.style.display = 'flex';
                modalInstructor.style.display = 'none';
                modalBatch.style.display = 'none';
                modalCall.style.display = 'none';
                modalProfile.style.display = 'none';
                document.getElementById('modal-pinned').style.display = 'block';
            }
        } else if (actionText === 'Change Theme') {
            const colors = ['#8C82FE', '#FF5A96', '#41D185', '#0084FF', '#FF9F00'];
            if (window.themeIndex === undefined) window.themeIndex = 0;
            window.themeIndex = (window.themeIndex + 1) % colors.length;
            const newColor = colors[window.themeIndex];
            
            document.documentElement.style.setProperty('--primary-color', newColor);
            
            const styleId = 'dynamic-theme-style';
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = `
                .msg-container.sent .msg-bubble { background: ${newColor} !important; color: white !important; } 
                .send-btn i { color: ${newColor} !important; } 
                .chat-tab.active { background: ${newColor} !important; } 
                .btn-request { background: ${newColor} !important; } 
                .primary-btn { background: ${newColor} !important; }
            `;
        } else if (actionText === 'Edit Nickname') {
            const currentName = document.getElementById('chat-header-name').textContent;
            const newName = prompt("Enter new nickname:", currentName);
            if (newName && newName.trim() !== '') {
                document.getElementById('chat-header-name').textContent = newName;
                let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
                if (user) user.name = newName;
                renderUserList();
            }
        } else if (actionText === 'Media & Files') {
            alert('Media & Files for this chat: \\n- Image1.png\\n- Document.pdf\\n- Video.mp4');
        } else if (actionText === 'Restrict') {
            if(confirm("Are you sure you want to restrict this user?")) {
                alert("User restricted.");
            }
        } else if (actionText === 'Report') {
            const reason = prompt("Please provide a reason for reporting:", "Spam or harassment");
            if (reason) alert("Report submitted.");
        }
    });

    // Call Logic
    function startCall(isVideo) {
        let user = [...mockData.instructors, ...mockData.batches].find(u => u.id === activeUserId);
        if(!user) return;
        
        document.getElementById('call-avatar').src = user.avatar;
        document.getElementById('call-name').innerHTML = user.name;
        document.getElementById('call-status').innerHTML = isVideo ? 'Video calling...' : 'Calling...';
        
        // Show/hide video buttons correctly
        const videoBtns = document.querySelectorAll('.btn-video-only');
        videoBtns.forEach(btn => {
            btn.style.display = isVideo ? 'flex' : 'none';
        });

        chatModalOverlay.style.display = 'flex';
        modalInstructor.style.display = 'none';
        modalBatch.style.display = 'none';
        modalProfile.style.display = 'none';
        modalCall.style.display = 'block';
    }

    document.getElementById('action-phone').addEventListener('click', () => startCall(false));
    document.getElementById('action-video').addEventListener('click', () => startCall(true));

    document.getElementById('btn-end-call').addEventListener('click', () => {
        chatModalOverlay.style.display = 'none';
    });

    // Mute / Camera flip logic
    document.getElementById('btn-mute-audio').addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-microphone')) {
            icon.classList.replace('fa-microphone', 'fa-microphone-slash');
            icon.style.color = '#EF4444';
        } else {
            icon.classList.replace('fa-microphone-slash', 'fa-microphone');
            icon.style.color = '';
        }
    });

    document.getElementById('btn-camera').addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-video')) {
            icon.classList.replace('fa-video', 'fa-video-slash');
            icon.style.color = '#EF4444';
        } else {
            icon.classList.replace('fa-video-slash', 'fa-video');
            icon.style.color = '';
        }
    });

    document.getElementById('btn-camera-flip').addEventListener('click', function() {
        // Just animate the flip icon to simulate functionality
        const icon = this.querySelector('i');
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => { icon.style.transform = 'rotate(0deg)'; }, 300);
    });

    // --- Main Initial Render ---
    renderUserList();
    renderMessages();
});
