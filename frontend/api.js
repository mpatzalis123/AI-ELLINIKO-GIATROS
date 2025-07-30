// 📁 js/api.js

const BASE_URL = 'https://ai-elliniko-giatros-1.onrender.com';

// 🔹 Φόρτωση σεναρίων
export async function fetchScenarios() {
  const res = await fetch(`${BASE_URL}/scenarios`);
  if (!res.ok) throw new Error('Απέτυχε η φόρτωση σεναρίων');
  return res.json();
}

// 🔹 Αποστολή μηνύματος στο /chat
export async function sendChatMessage({ session_id, message, scenario, nurseMode, patientMode }) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, message, scenario, nurseMode, patientMode })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Σφάλμα απάντησης AI');
  }

  return res.json();
}

// 🔹 Φυσική εξέταση
export async function requestPhysicalExam({ session_id, scenario }) {
  const res = await fetch(`${BASE_URL}/physical_exam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, scenario })
  });

  if (!res.ok) throw new Error(`Σφάλμα φυσικής εξέτασης (code ${res.status})`);
  return res.json();
}

// 🔹 Διαγνωστικά τεστ
export async function requestDiagnosticTests({ session_id, scenario }) {
  const res = await fetch(`${BASE_URL}/diagnostic_tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, scenario })
  });

  if (!res.ok) throw new Error(`Σφάλμα διαγνωστικών τεστ (code ${res.status})`);
  return res.json();
}

// 🔹 Αποστολή feedback
export async function submitFeedback({ session_id, scenario, history }) {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, scenario, history })
  });

  if (!res.ok) throw new Error('Σφάλμα αποστολής feedback');
  return res.json();
}
