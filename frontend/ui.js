// 📁 js/ui.js

export function appendMessage(text, sender) {
  const chatWindow = document.getElementById('chatWindow');

  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', sender);

  const bubble = document.createElement('div');
  bubble.classList.add('message', sender);
  bubble.textContent = text;

  const avatar = document.createElement('div');
avatar.classList.add('avatar');

let avatarFile = 'user.png'; // default

if (sender === 'ai') avatarFile = 'ai.png';
else if (sender === 'system') avatarFile = 'system.png';

avatar.innerHTML = `<img src="avatars/${avatarFile}" alt="${sender} avatar" />`;



  // ✅ Πολύ σημαντικό: Σωστή σειρά με βάση τον ρόλο
  if (sender === 'ai') {
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
} else {
  wrapper.appendChild(bubble);
  wrapper.appendChild(avatar);
}


  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}







export function showFeedbackMessage(text, duration = 4000) {
  const feedbackMessage = document.getElementById('feedbackMessage');
  feedbackMessage.textContent = text;
  setTimeout(() => {
    feedbackMessage.textContent = '';
  }, duration);
}

export function resetChatUI() {
  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const physicalExamBtn = document.getElementById('physicalExamBtn');

  // ✅ Καθαρισμός του chat window ΠΡΙΝ προσθέσουμε οτιδήποτε
  if (chatWindow) {
    chatWindow.innerHTML = '';
  }

  // ✅ Welcome banner
  const banner = document.createElement('div');
  banner.classList.add('chat-banner');
  banner.innerHTML = '💬 Welcome to the <strong>AI Patient Actor</strong>';
  chatWindow.appendChild(banner);

  // ✅ Reset input
  chatInput.value = "Είμαι ο Νοσηλευτής Πουτσοζ. Τι πάθατε;";
  chatInput.focus();

  // ✅ Reset button
  physicalExamBtn.disabled = false;
  physicalExamBtn.textContent = '🩺 Φυσική Εξέταση';
}


export function populateScenarios(scenarios) {
  const select = document.getElementById('scenarioSelect');
  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Επιλέξτε Σενάριο --';
  select.appendChild(defaultOption);

  scenarios.forEach(({ id, title }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = title;
    select.appendChild(option);
  });
}

export function showModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.style.display = 'flex';
}

export function hideModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.style.display = 'none';
}

export function showResetButton(callback) {
  const chatWindow = document.getElementById('chatWindow');
  const resetDiv = document.createElement('div');
  resetDiv.style.textAlign = 'center';
  resetDiv.style.marginTop = '1rem';

  const resetButton = document.createElement('button');
  resetButton.id = 'resetBtn';
  resetButton.textContent = '🔄 Νέα Συνομιλία';
  resetButton.style.backgroundColor = '#ffe0b2';
  resetButton.style.color = '#bf360c';
  resetButton.style.border = '1px solid #f57c00';
  resetButton.style.padding = '0.5rem 1rem';
  resetButton.style.fontSize = '0.95rem';
  resetButton.style.borderRadius = '6px';
  resetButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
  resetButton.style.cursor = 'pointer';

  resetButton.addEventListener('click', callback);

  resetDiv.appendChild(resetButton);
  chatWindow.appendChild(resetDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
