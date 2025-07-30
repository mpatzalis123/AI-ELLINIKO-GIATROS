import {
  fetchScenarios,
  sendChatMessage,
  requestDiagnosticTests,
  requestPhysicalExam,
  submitFeedback
} from './api.js';

import {
  populateScenarios,
  resetChatUI,
  appendMessage,
  showFeedbackMessage,
  showModal,
  hideModal,
  showResetButton
} from './ui.js';

import { getSessionId, resetSessionId } from './state.js';

let feedbackGiven = false;
const conversationHistory = [];
let diagnosticUsed = false;
let physicalUsed = false;



console.log("🧠 JS φορτώθηκε (main.js)");

document.addEventListener('DOMContentLoaded', async () => {
  console.log("✅ DOM πλήρως φορτωμένο");

  resetChatUI();

  try {
    const scenarios = await fetchScenarios();
    populateScenarios(scenarios);
  } catch (e) {
    showFeedbackMessage('❌ Σφάλμα φόρτωσης σεναρίων');
  }

  document.getElementById('scenarioSelect').addEventListener('change', () => {
    resetChatUI();
    conversationHistory.length = 0;
    feedbackGiven = false;
    resetSessionId();
  });

  document.getElementById('sendBtn').addEventListener('click', async () => {
    // ... λογική αποστολής μηνύματος ...
  });

  document.getElementById('diagnosticTestsBtn').addEventListener('click', async () => {
    // ... λογική διαγνωστικών τεστ ...
  });

  document.getElementById('physicalExamBtn').addEventListener('click', async () => {
    // ... λογική φυσικής εξέτασης ...
  });

  // ✅ ✅ Εδώ το σωστό σημείο για το κουμπί "Τερματισμός Συνομιλίας"
  document.getElementById('endChatBtn').addEventListener('click', () => {
    if (feedbackGiven || conversationHistory.length === 0) return;
    showModal();
  });

  // ✅ Φόρτωση του diagnosis-feedback.html και σύνδεση listeners
fetch('diagnosis-feedback.html')
  .then(res => res.text())
  .then(async html => {
    document.getElementById('modal-container').innerHTML = html;

    document.getElementById('diagnosisForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideModal();

  appendMessage('📤 Υποβλήθηκαν οι διαγνώσεις. Αναμονή', 'ai');
  const aiMessages = document.querySelectorAll('.message.ai');
  const thinkingEl = aiMessages[aiMessages.length - 1];

  // ⏳ Animation με τελείες
  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingEl.textContent = '📤 Υποβλήθηκαν οι διαγνώσεις. Αναμονή' + '.'.repeat(dotCount);
  }, 500);

  try {
    const feedback = await submitFeedback({
      session_id: getSessionId(),
      scenario: document.getElementById('scenarioSelect').value,
      history: conversationHistory
    });

    clearInterval(dotInterval);
    thinkingEl.textContent = `📋 Ανατροφοδότηση:\n${feedback.feedback}`;
    feedbackGiven = true;
     const endChatBtn = document.getElementById('endChatBtn');
  const endChatBtnText = document.getElementById('endChatBtnText');

  if (endChatBtn && endChatBtnText) {
    endChatBtnText.textContent = '✅ Η ανατροφοδότηση ολοκληρώθηκε';
    endChatBtn.disabled = true;
    endChatBtn.style.backgroundColor = '#4caf50';
    endChatBtn.style.color = '#fff';
  }

    setTimeout(() => showResetButton(() => {
      resetSessionId();
      feedbackGiven = false;
      conversationHistory.length = 0;
      resetChatUI();
    }), 10000);
  } catch (e) {
    clearInterval(dotInterval);
    thinkingEl.textContent = '❌ Σφάλμα ανατροφοδότησης: ' + e.message;
  }
});


    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      hideModal();
    });
  });


  // Debug: Έλεγχος αν υπάρχουν τα IDs
  console.log("📌 sendBtn:", document.getElementById('sendBtn'));
  console.log("📌 chatInput:", document.getElementById('chatInput'));
  console.log("📌 scenarioSelect:", document.getElementById('scenarioSelect'));
  console.log("📌 physicalExamBtn:", document.getElementById('physicalExamBtn'));
  console.log("📌 diagnosticTestsBtn:", document.getElementById('diagnosticTestsBtn'));

  

  try {
    const scenarios = await fetchScenarios();
    populateScenarios(scenarios);
  } catch (e) {
    showFeedbackMessage('❌ Σφάλμα φόρτωσης σεναρίων');
  }

  document.getElementById('scenarioSelect').addEventListener('change', () => {
    resetChatUI();
    conversationHistory.length = 0;
    feedbackGiven = false;
    resetSessionId();
  });

 document.getElementById('sendBtn').addEventListener('click', async () => {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  const scenario = document.getElementById('scenarioSelect').value;

  if (!message || !scenario) {
    showFeedbackMessage('⚠️ Συμπλήρωσε μήνυμα και σενάριο');
    return;
  }

  document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('sendBtn').click();
  }
});

  const nurseMode = document.querySelector('input[name="nurseMode"]:checked').value;
  const patientMode = document.querySelector('input[name="patientMode"]:checked').value;

  appendMessage(message, 'user');
  conversationHistory.push({ role: 'user', content: message });
  input.value = '';

  appendMessage('🧠 Ο ασθενής σκέφτεται την απάντησή του', 'ai');
  const aiMessages = document.querySelectorAll('.message.ai');
  const thinkingEl = aiMessages[aiMessages.length - 1];

  let dotCount = 0;
  let dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingEl.textContent = '🧠 Ο ασθενής σκέφτεται την απάντησή του' + '.'.repeat(dotCount);
  }, 500);

  try {
    const data = await sendChatMessage({
      session_id: getSessionId(),
      message,
      scenario,
      nurseMode,
      patientMode
    });

    clearInterval(dotInterval); // ✅ Σταματάει το animation
    thinkingEl.textContent = data.reply;

    if (patientMode === 'speech') {
      const utter = new SpeechSynthesisUtterance(data.reply);
      utter.lang = 'el-GR';
      speechSynthesis.speak(utter);
    }

    conversationHistory.push({ role: 'assistant', content: data.reply });
  } catch (e) {
    clearInterval(dotInterval); // ✅ Σταματάει ακόμα κι αν υπάρξει σφάλμα
    thinkingEl.textContent = '❌ Σφάλμα: ' + e.message;
  }
});


  document.getElementById('physicalExamBtn').addEventListener('click', async () => {
  if (physicalUsed) return;

  const scenario = document.getElementById('scenarioSelect').value;
  if (!scenario) return showFeedbackMessage('⚠️ Επίλεξε σενάριο πρώτα.');

  physicalUsed = true;
  const physicalBtn = document.getElementById('physicalExamBtn');
  physicalBtn.disabled = true;

  appendMessage('🩺 Ζητήθηκε φυσική εξέταση', 'user');
  conversationHistory.push({ role: 'user', content: 'Ζητήθηκε φυσική εξέταση' });

  appendMessage('📋 Ο ασθενής εξετάζεται', 'ai');
  const aiMessages = document.querySelectorAll('.message.ai');
  const thinkingEl = aiMessages[aiMessages.length - 1];

  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingEl.textContent = '📋 Ο ασθενής εξετάζεται' + '.'.repeat(dotCount);
  }, 500);

  try {
    const res = await requestPhysicalExam({ session_id: getSessionId(), scenario });

    clearInterval(dotInterval);

    const msg = `📋 Φυσική Εξέταση - Αναλυτικά Αποτελέσματα:

🌡 Θερμοκρασία σώματος: ${res.temperature_celsius ?? 'Δεν καταγράφηκε'} °C
🩺 Αρτηριακή πίεση: ${
  res.blood_pressure_mmHg?.systolic && res.blood_pressure_mmHg?.diastolic
    ? `${res.blood_pressure_mmHg.systolic}/${res.blood_pressure_mmHg.diastolic} mmHg`
    : 'Δεν καταγράφηκε'
}
💓 Καρδιακή συχνότητα: ${res.pulse_bpm ?? 'Δεν καταγράφηκε'} bpm
💨 Κορεσμός οξυγόνου: ${res.oxygen_saturation_percent != null ? res.oxygen_saturation_percent + '%' : 'Δεν καταγράφηκε'}

🧠 Νευρολογική κατάσταση:
• Συνείδηση: ${res.neurological_status?.consciousness_level ?? 'Άγνωστη'}
• Προσανατολισμός: ${res.neurological_status?.orientation ?? 'Άγνωστος'}
• Ζάλη: ${res.neurological_status?.dizziness ?? 'Δεν καταγράφηκε'}

🦴 Μυοσκελετικό:
• Πόνος: ${res.musculoskeletal_system?.pain_location ?? 'Όχι αναφερθέν'}
• Κινητικότητα: ${res.musculoskeletal_system?.mobility ?? 'Άγνωστη'}
• Ισχύς μυών: ${res.musculoskeletal_system?.muscle_strength ?? 'Άγνωστη'}
• Οίδημα: ${res.musculoskeletal_system?.swelling ?? 'Όχι καταγεγραμμένο'}
• Εκχυμώσεις: ${res.musculoskeletal_system?.bruising ?? 'Όχι παρατηρήθηκαν'}

🧍 Δέρμα:
• Χρώμα: ${res.skin_condition?.color ?? 'Άγνωστο'}
• Θερμοκρασία: ${res.skin_condition?.temperature ?? 'Δεν καταγράφηκε'}

🧠 Ψυχολογική εικόνα:
• Συναισθηματική κατάσταση: ${res.psychological_state?.emotional_state ?? 'Μη διαθέσιμη'}
• Συνεργασία: ${res.psychological_state?.cooperation ?? 'Δεν αξιολογήθηκε'}
`;

    thinkingEl.textContent = msg;

    // ✅ Προσθήκη απάντησης στο ιστορικό
    conversationHistory.push({ role: 'assistant', content: msg });

    // ✅ Αλλαγή κειμένου κουμπιού
    physicalBtn.textContent = '✅ Η φυσική εξέταση πραγματοποιήθηκε';

    // ✅ Μήνυμα επιβεβαίωσης στο chat
    appendMessage('✅ Η φυσική εξέταση πραγματοποιήθηκε', 'system');
  } catch (e) {
    clearInterval(dotInterval);
    thinkingEl.textContent = '❌ Σφάλμα: ' + e.message;
  }
});


document.getElementById('diagnosticTestsBtn').addEventListener('click', async () => {
  if (diagnosticUsed) return;

  const scenario = document.getElementById('scenarioSelect').value;
  if (!scenario) return showFeedbackMessage('⚠️ Επίλεξε σενάριο πρώτα.');

  diagnosticUsed = true;
  const diagnosticBtn = document.getElementById('diagnosticTestsBtn');
  diagnosticBtn.disabled = true;

  appendMessage('🔬 Ζητήθηκαν διαγνωστικά τεστ', 'user');
  conversationHistory.push({ role: 'user', content: 'Ζητήθηκαν διαγνωστικά τεστ' });

  appendMessage('🔬 Λήψη διαγνωστικών αποτελεσμάτων', 'ai');
  const aiMessages = document.querySelectorAll('.message.ai');
  const thinkingEl = aiMessages[aiMessages.length - 1];

  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingEl.textContent = '🔬 Λήψη διαγνωστικών αποτελεσμάτων' + '.'.repeat(dotCount);
  }, 500);

  try {
    const res = await requestDiagnosticTests({ session_id: getSessionId(), scenario });

    clearInterval(dotInterval);

    const msg = `📋 Αποτελέσματα Διαγνωστικών Εξετάσεων:\n\n${res.diagnostic_tests}`;
    thinkingEl.textContent = msg;

    // 👉 Καταγράφεται στο ιστορικό
    conversationHistory.push({ role: 'assistant', content: msg });

    // ✅ Ενημέρωση κουμπιού
    diagnosticBtn.textContent = '✅ Πραγματοποίηση διαγνωστικών εξετάσεων';

    // ✅ Μήνυμα επιβεβαίωσης στο chat (προαιρετικό)
    appendMessage('✅ Οι διαγνωστικές εξετάσεις πραγματοποιήθηκαν', 'system');
  } catch (e) {
    clearInterval(dotInterval);
    thinkingEl.textContent = '❌ Σφάλμα: ' + e.message;
  }
});


});
