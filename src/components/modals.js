const AVATARS = [
  { id: 'nebula', emoji: '\u{1F319}', bg: 'linear-gradient(135deg,#312e81,#6d28d9)' },
  { id: 'spark', emoji: '\u2728', bg: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  { id: 'comet', emoji: '\u{1F680}', bg: 'linear-gradient(135deg,#4338ca,#6366f1)' },
  { id: 'star', emoji: '\u{1F31F}', bg: 'linear-gradient(135deg,#6d28d9,#a78bfa)' },
  { id: 'fox', emoji: '\u{1F98A}', bg: 'linear-gradient(135deg,#5b21b6,#7c3aed)' },
  { id: 'cat', emoji: '\u{1F431}', bg: 'linear-gradient(135deg,#3730a3,#6d28d9)' },
  { id: 'owl', emoji: '\u{1F989}', bg: 'linear-gradient(135deg,#312e81,#4f46e5)' },
  { id: 'orb', emoji: '\u{1F52E}', bg: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' },
];

function getAvatarById(id) {
  return AVATARS.find((avatar) => avatar.id === id) || null;
}

function applyAvatar(el, avatarId, fallbackText = '?') {
  if (!el) return;

  const avatar = getAvatarById(avatarId);
  if (!avatar) {
    el.style.background = '';
    el.textContent = fallbackText;
    return;
  }

  el.style.background = avatar.bg;
  el.textContent = avatar.emoji;
}

export function createUnfriendModal() {
  const modal = document.getElementById('unfriendModal');
  const title = document.getElementById('unfriendModalTitle');
  const desc = document.getElementById('unfriendModalDesc');
  const cancel = document.getElementById('unfriendCancel');
  const confirm = document.getElementById('unfriendConfirm');
  const backdrop = modal ? modal.querySelector('.confirm-modal-backdrop') : null;

  function close() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  function open(friendName = 'this friend') {
    if (!modal || !confirm || !cancel) {
      return Promise.resolve(false);
    }

    if (title) title.textContent = 'Unfriend?';
    if (desc) desc.textContent = `Remove ${friendName} and clear shared history?`;
    modal.style.display = 'flex';

    return new Promise((resolve) => {
      function cleanup(value) {
        confirm.removeEventListener('click', onConfirm);
        cancel.removeEventListener('click', onCancel);
        if (backdrop) backdrop.removeEventListener('click', onCancel);
        close();
        resolve(value);
      }

      function onConfirm() {
        cleanup(true);
      }

      function onCancel() {
        cleanup(false);
      }

      confirm.addEventListener('click', onConfirm);
      cancel.addEventListener('click', onCancel);
      if (backdrop) backdrop.addEventListener('click', onCancel);
    });
  }

  return {
    open,
    close,
  };
}

export function createProfileModal({ onSave }) {
  const modal = document.getElementById('profileModal');
  const closeButton = document.getElementById('profileModalClose');
  const saveButton = document.getElementById('profileSaveBtn');
  const backdrop = modal ? modal.querySelector('.profile-modal-backdrop') : null;
  const avatarBig = document.getElementById('profileAvatarBig');
  const avatarGrid = document.getElementById('profileAvatarGrid');
  const displayNameInput = document.getElementById('profileDisplayName');
  const bioInput = document.getElementById('profileBio');
  const ageInput = document.getElementById('profileAge');
  const genderInput = document.getElementById('profileGender');

  let selectedAvatar = '';

  function close() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  function syncAvatarSelection() {
    if (!avatarGrid) return;

    avatarGrid.querySelectorAll('.av-btn').forEach((button) => {
      const isSelected = button.dataset.avatarId === selectedAvatar;
      button.classList.toggle('sel', isSelected);
    });

    applyAvatar(avatarBig, selectedAvatar, '?');
  }

  function buildGrid() {
    if (!avatarGrid || avatarGrid.dataset.ready === '1') return;

    avatarGrid.innerHTML = '';
    AVATARS.forEach((avatar) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'av-btn';
      button.dataset.avatarId = avatar.id;
      button.title = avatar.id;
      button.style.background = avatar.bg;
      button.textContent = avatar.emoji;
      button.addEventListener('click', () => {
        selectedAvatar = avatar.id;
        syncAvatarSelection();
      });
      avatarGrid.appendChild(button);
    });

    avatarGrid.dataset.ready = '1';
  }

  function open(profile = {}) {
    if (!modal) return;

    buildGrid();

    selectedAvatar = String(profile.avatarId || '').trim();
    if (!getAvatarById(selectedAvatar) && AVATARS[0]) {
      selectedAvatar = AVATARS[0].id;
    }

    if (displayNameInput) displayNameInput.value = profile.displayName || '';
    if (bioInput) bioInput.value = profile.bio || '';
    if (ageInput) ageInput.value = profile.age || '';
    if (genderInput) genderInput.value = profile.gender || '';

    syncAvatarSelection();
    modal.style.display = 'flex';
  }

  if (closeButton) {
    closeButton.addEventListener('click', close);
  }

  if (backdrop) {
    backdrop.addEventListener('click', close);
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const payload = {
        avatarId: selectedAvatar,
        displayName: displayNameInput ? displayNameInput.value.trim() : '',
        bio: bioInput ? bioInput.value.trim() : '',
        age: ageInput ? String(ageInput.value || '').trim() : '',
        gender: genderInput ? String(genderInput.value || '').trim() : '',
      };

      if (typeof onSave === 'function') {
        onSave(payload);
      }

      close();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (modal && modal.style.display !== 'none') {
      close();
    }
  });

  return {
    open,
    close,
    applyAvatar,
    getAvatarById,
  };
}
