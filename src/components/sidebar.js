function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';

  return dt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function createSidebar({
  onSelectFriend,
  onSelectAi,
  onAddFriend,
  onAcceptRequest,
  onLogout,
  onOpenProfile,
}) {
  const friendList = document.getElementById('friendList');
  const requestList = document.getElementById('requestList');
  const friendCount = document.getElementById('friendCount');
  const onlineCount = document.getElementById('onlineCount');
  const requestCount = document.getElementById('requestCount');
  const addFriendForm = document.getElementById('addFriendForm');
  const friendInput = document.getElementById('friendInput');
  const aiFriendButton = document.querySelector('.ai-friend');
  const logoutButton = document.getElementById('logoutBtn');
  const editProfileButton = document.getElementById('editProfileBtn');

  let currentFriends = [];
  let currentRequests = [];
  let activeFriend = '';
  let aiMode = false;

  function renderCounts() {
    if (friendCount) {
      friendCount.textContent = currentFriends.length ? String(currentFriends.length) : '';
    }

    if (onlineCount) {
      const online = currentFriends.filter((friend) => friend.online).length;
      onlineCount.textContent = online > 0 ? `${online} online` : '';
    }

    if (requestCount) {
      requestCount.textContent = currentRequests.length ? String(currentRequests.length) : '';
    }
  }

  function renderRequests() {
    if (!requestList) return;

    requestList.innerHTML = '';

    currentRequests.forEach((username) => {
      const row = document.createElement('li');
      row.className = 'req-row';

      const label = document.createElement('span');
      label.textContent = username;

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Accept';
      button.addEventListener('click', () => {
        if (typeof onAcceptRequest === 'function') {
          onAcceptRequest(username);
        }
      });

      row.append(label, button);
      requestList.appendChild(row);
    });

    renderCounts();
  }

  function friendInitial(username) {
    const value = String(username || '').trim();
    if (!value) return '?';
    return value.slice(0, 2).toUpperCase();
  }

  function renderFriends() {
    if (!friendList) return;

    friendList.innerHTML = '';

    currentFriends.forEach((friend) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `friend-row${!aiMode && activeFriend === friend.username ? ' active' : ''}`;
      button.dataset.username = friend.username;

      const avatar = document.createElement('div');
      avatar.className = `fr-av${friend.online ? ' on' : ''}`;
      avatar.textContent = friendInitial(friend.displayName || friend.username);

      const main = document.createElement('div');
      main.className = 'fr-main';

      const name = document.createElement('p');
      name.className = 'fr-name';
      name.textContent = friend.displayName || friend.username;

      const preview = document.createElement('span');
      preview.className = 'fr-prev';
      preview.textContent = friend.lastMessage || (friend.online ? 'Online now' : 'No messages yet');

      main.append(name, preview);

      const side = document.createElement('div');
      side.className = 'fr-side';

      const time = document.createElement('span');
      time.className = `fr-time${friend.online ? ' on' : ''}`;
      time.textContent = friend.online
        ? 'online'
        : formatRelativeTime(friend.lastTimestamp || friend.lastSeenAt) || 'offline';

      side.appendChild(time);

      if (friend.unreadCount > 0) {
        const unread = document.createElement('span');
        unread.className = 'unread';
        unread.textContent = friend.unreadCount > 99 ? '99+' : String(friend.unreadCount);
        side.appendChild(unread);
      }

      button.append(avatar, main, side);
      button.addEventListener('click', () => {
        if (typeof onSelectFriend === 'function') {
          onSelectFriend(friend.username);
        }
      });

      friendList.appendChild(button);
    });

    if (aiFriendButton) {
      aiFriendButton.classList.toggle('active', aiMode);
    }

    renderCounts();
  }

  if (addFriendForm && friendInput) {
    addFriendForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = friendInput.value.trim();
      if (!username) return;

      if (typeof onAddFriend === 'function') {
        onAddFriend(username);
      }
      friendInput.value = '';
    });
  }

  if (aiFriendButton) {
    aiFriendButton.addEventListener('click', () => {
      if (typeof onSelectAi === 'function') {
        onSelectAi();
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      if (typeof onLogout === 'function') {
        onLogout();
      }
    });
  }

  if (editProfileButton) {
    editProfileButton.addEventListener('click', () => {
      if (typeof onOpenProfile === 'function') {
        onOpenProfile();
      }
    });
  }

  return {
    setFriends(friends) {
      currentFriends = Array.isArray(friends) ? [...friends] : [];
      renderFriends();
    },
    setRequests(requests) {
      currentRequests = Array.isArray(requests) ? [...requests] : [];
      renderRequests();
    },
    setActiveFriend(username) {
      activeFriend = String(username || '');
      aiMode = false;
      renderFriends();
    },
    setAiMode(active) {
      aiMode = Boolean(active);
      if (aiMode) {
        activeFriend = '';
      }
      renderFriends();
    },
  };
}
