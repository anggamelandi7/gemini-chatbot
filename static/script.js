// ===== chat frontend (Vanilla JS) =====
// HTML structure expected:
// <form id="chat-form">
//   <input type="text" id="user-input" />
//   <button type="submit">Send</button>
// </form>
// <div id="chat-box"></div>

// --- Elements ---
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// --- Conversation state (kept in memory) ---
// Backend expects: [{ role: "user" | "model", text: "..." }, ...]
const conversation = [];

// --- Helpers ---
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`; // optional styling hook
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // return DOM node so we can update it later
}

function updateMessage(node, newText) {
  if (node) {
    node.textContent = newText;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function setFormDisabled(disabled) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = disabled;
  input.disabled = disabled;
}

function sanitize(str) {
  // Keep it simple: trim and ensure it's a string
  return String(str || "").trim();
}

// Simple fetch wrapper with timeout
async function postJSON(url, data, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    // Non-2xx
    if (!res.ok) {
      let payload = {};
      try {
        payload = await res.json();
      } catch {}
      const errMsg =
        payload?.message ||
        `Request failed with status ${res.status} ${res.statusText}`;
      throw new Error(errMsg);
    }

    const json = await res.json();
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// --- Submit handler ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = sanitize(input.value);
  if (!userMessage) return;

  // 1) Add user's message to chat + state
  appendMessage("user", userMessage);
  conversation.push({ role: "user", text: userMessage });

  // Clear input and lock UI while sending
  input.value = "";
  setFormDisabled(true);

  // 2) Show temporary "Thinking..." bot message
  const thinkingNode = appendMessage("bot", "Thinking...");

  try {
    // 3) Send POST to /api/chat with current conversation
    const payload = { conversation };
    const json = await postJSON("/api/chat", payload);

    // Backend spec kamu mengembalikan:
    // { success: boolean, message: string, data: string }
    // Namun untuk robustness, kita cek beberapa kemungkinan field:
    const aiText =
      sanitize(json?.result) || // jika suatu saat FE/BE pakai 'result'
      sanitize(json?.data) || // sesuai index.js 
      sanitize(json?.message) || // fallback terakhir
      "";

    if (!aiText) {
      updateMessage(thinkingNode, "Sorry, no response received.");
      return;
    }

    // 4) Replace "Thinking..." with AI reply
    updateMessage(thinkingNode, aiText);

    // Simpan ke state sebagai pesan 'model'
    conversation.push({ role: "model", text: aiText });
  } catch (err) {
    // 5) Error handling
    const msg =
      err?.name === "AbortError"
        ? "Failed to get response from server (timeout)."
        : sanitize(err?.message) || "Failed to get response from server.";
    updateMessage(thinkingNode, msg);
  } finally {
    // Re-enable UI and focus input
    setFormDisabled(false);
    input.focus();
  }
});

// Optional: Enter focuses input on page load
window.addEventListener("DOMContentLoaded", () => {
  input?.focus();
});
