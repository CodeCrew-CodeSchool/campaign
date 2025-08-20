let isGenerating = false;
let selectedEmailVolume = 0;
let generatedEmails = [];
let currentEmailIndex = 0;

// --- Utility functions ---
function selectVolume(volume, element) {
  selectedEmailVolume = volume;

  document.querySelectorAll('.volume-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');

  document.getElementById('emailSetup').classList.add('active');
  updateRecipientCount();
}

function updateRecipientCount() {
  const raw = document.getElementById('recipientEmails')?.value || '';
  const emails = parseEmails(raw);
  const limited = emails.slice(0, selectedEmailVolume || 500);

  document.getElementById('recipientCount').textContent = limited.length;
  document.getElementById('selectedVolume').textContent = limited.length;

  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    if (limited.length > 0 && generatedEmails.length > 0) {
      sendBtn.classList.add('active');
      sendBtn.disabled = false;
    } else {
      sendBtn.classList.remove('active');
      sendBtn.disabled = true;
    }
  }

  const recipientListContainer = document.getElementById('recipientList');
  recipientListContainer.innerHTML = '';
  if (limited.length > 0 && limited.length <= 2) {
    limited.forEach(email => {
      const label = document.createElement('label');
      label.classList.add('recipient-option');
      label.innerHTML = `
        <input type="checkbox" name="selectedRecipients" value="${email}" checked>
        ${email}
      `;
      recipientListContainer.appendChild(label);
    });
  }

  return limited;
}

function parseEmails(text) {
  return [...new Set(
    text.split(/[\n,]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )];
}

// --- Email navigator & display ---
function showEmail(index) {
  if (!generatedEmails.length) return;
  const email = generatedEmails[index];

  const singleEmailContainer = document.getElementById('singleEmail');
  singleEmailContainer.innerHTML = `
    <div class="email-block" style="padding:1rem; border:1px solid #ccc; border-radius:8px;">
      <h3>Subject: ${email.subject}</h3>
      <p>${email.body.replace(/\n/g, '<br>')}</p>
      <div class="email-count">Email ${index + 1} of ${generatedEmails.length}</div>
    </div>
  `;

  document.getElementById('emailNavigator').style.display = 'flex';
  document.getElementById('prevEmail').disabled = index === 0;
  document.getElementById('nextEmail').disabled = index === generatedEmails.length - 1;

  // Attach the single copy button to copy current email
  const copyBtn = document.getElementById('copyEmailBtn');
  if (copyBtn) {
    copyBtn.onclick = () => copyEmail(index);
  }
}

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', function () {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => input.parentElement.style.transform = 'translateY(-2px)');
    input.addEventListener('blur', () => input.parentElement.style.transform = 'translateY(0)');
  });

  const recipientField = document.getElementById('recipientEmails');
  if (recipientField) recipientField.addEventListener('input', updateRecipientCount);

  document.getElementById('prevEmail').onclick = () => {
    if (currentEmailIndex > 0) {
      currentEmailIndex--;
      showEmail(currentEmailIndex);
    }
  };
  document.getElementById('nextEmail').onclick = () => {
    if (currentEmailIndex < generatedEmails.length - 1) {
      currentEmailIndex++;
      showEmail(currentEmailIndex);
    }
  };
});

// --- Generate Emails ---
async function generateEmails(event) {
  if (event) event.preventDefault();
  if (isGenerating) return;

  const userInput = document.getElementById("userInput").value.trim();
  const recipientName = document.getElementById("recipientName").value.trim() || "there";
  const output = document.getElementById("output");
  const generateBtn = document.getElementById("generateBtn");

  if (!userInput) {
    alert("Please describe your product or service first.");
    return;
  }

  isGenerating = true;
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="loading"></span>Generating amazing emails...';

  output.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">✨</div>
      <p>Crafting your personalized marketing emails...</p>
    </div>
  `;

  try {
    const response = await fetch("/generate-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput, recipientName })
    });

    const data = await response.json();

    if (data.output) {
      const rawEmails = data.output.split(/\*\*Email \d+: Subject:/).filter(Boolean);
      generatedEmails = rawEmails.map(email => {
        const lines = email.trim().split('\n').filter(line => line.trim() !== '');
        const subject = lines.shift().replace(/\*\*/g, '').trim();
        const body = lines.join('\n');
        return { subject, body };
      });

      currentEmailIndex = 0;
      output.innerHTML = "";
      showEmail(currentEmailIndex);
      updateRecipientCount();
    } else throw new Error("No content generated");
  } catch (err) {
    console.error(err);
    output.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Oops! Something went wrong. Please try again.</p>
      </div>
    `;
    document.getElementById('emailNavigator').style.display = 'none';
  } finally {
    isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.innerHTML = 'Generate Marketing Emails';
  }
}

// --- Copy Email ---
function copyEmail(index) {
  const email = generatedEmails[index];
  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;

  const copyBtn = document.getElementById('copyEmailBtn');
  navigator.clipboard.writeText(fullEmail).then(() => {
    const old = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.background = 'var(--success-color)';
    copyBtn.style.color = 'white';
    setTimeout(() => {
      copyBtn.textContent = old;
      copyBtn.style.background = '';
      copyBtn.style.color = '';
    }, 2000);
  });
}

// --- Send Emails ---
async function sendEmails() {
  if (selectedEmailVolume === 0) {
    alert("Please select an email volume first.");
    return;
  }

  if (generatedEmails.length === 0) {
    alert("Please generate emails first.");
    return;
  }

  const senderName = document.getElementById('senderName').value.trim();
  const senderEmail = document.getElementById('senderEmail').value.trim();
  const leadSource = document.getElementById('leadSource').value;
  const recipients = updateRecipientCount();

  if (!senderName || !senderEmail) {
    alert("Please enter your name and email.");
    return;
  }

  if (recipients.length === 0) {
    alert("Please enter at least one valid recipient email.");
    return;
  }

  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressCount = document.getElementById('progressCount');
  const sendBtn = document.getElementById('sendBtn');

  progressSection.classList.add('active');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="loading"></span>Sending Emails...';

  try {
    const response = await fetch("http://localhost:5000/send-mass-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emails: generatedEmails,
        recipients,
        volume: selectedEmailVolume,
        senderName,
        senderEmail,
        leadSource,
        productDescription: document.getElementById("userInput").value
      })
    });

    const data = await response.json();

    if (data.success) {
      const totalSent = data.sentCount || recipients.length;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
          progressText.textContent = `✅ Successfully sent ${totalSent.toLocaleString()} emails!`;
          progressCount.textContent = `${totalSent} / ${totalSent}`;
          sendBtn.innerHTML = `🎉 Sent ${totalSent.toLocaleString()} Emails!`;
          sendBtn.style.background = 'linear-gradient(135deg, var(--success-color), #059669)';
          setTimeout(() => {
            progressSection.classList.remove('active');
            sendBtn.disabled = false;
            sendBtn.innerHTML = `Send ${selectedEmailVolume.toLocaleString()} Emails Now`;
            sendBtn.style.background = '';
            progressFill.style.width = '0%';
          }, 5000);
        } else {
          progressText.textContent = `Sending emails... ${Math.round(progress)}% complete`;
          progressCount.textContent = `${Math.round(progress * totalSent / 100)} / ${totalSent}`;
        }
        progressFill.style.width = progress + '%';
      }, 200);
    } else {
      throw new Error(data.message || "Failed to send emails");
    }
  } catch (err) {
    console.error(err);
    progressText.textContent = "❌ Failed to send emails.";
    sendBtn.disabled = false;
    sendBtn.innerHTML = `Send ${selectedEmailVolume.toLocaleString()} Emails Now`;
  }
}
