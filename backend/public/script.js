let isGenerating = false;
let selectedEmailVolume = 0;
let generatedEmails = [];
let currentEmailIndex = 0;

// --- Add these utility functions at the top ---

function selectVolume(volume, element) {
  selectedEmailVolume = volume;

  document.querySelectorAll('.volume-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');

  document.getElementById('emailSetup').classList.add('active');
  document.getElementById('selectedVolume').textContent = volume.toLocaleString();

  if (generatedEmails.length > 0) {
    document.getElementById('sendBtn').classList.add('active');
  }

  updateRecipientCount();
}
function updateRecipientCount() {
  const raw = document.getElementById('recipientEmails')?.value || '';
  const emails = parseEmails(raw);
  const limited = emails.slice(0, selectedEmailVolume || 500);
  if (document.getElementById('recipientCount')) {
    document.getElementById('recipientCount').textContent = limited.length;
  }
     const recipientListContainer = document.getElementById('recipientList');
  if (recipientListContainer) {
    recipientListContainer.innerHTML = ''; // clear old list
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
  }

  return limited;
}

 

function parseEmails(text) {
  return [...new Set(
    text
      .split(/[\n,]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )];
}  

// Email Navigator Logic 
function showEmail(index) {
  if (!generatedEmails.length) return;
  const email = generatedEmails[index];
  document.getElementById('singleEmail').innerHTML = `
    <div class="email-block">
      <button class="copy-btn" onclick="copyEmail(${index})">Copy</button>
      <h3>Subject: ${email.subject}</h3>
      <p>${email.body.replace(/\n/g, '<br>')}</p>
      <div class="email-count">Email ${index + 1} of ${generatedEmails.length}</div>
    </div>
  `;
  document.getElementById('emailNavigator').style.display = 'flex';
  document.getElementById('prevEmail').disabled = index === 0;
  document.getElementById('nextEmail').disabled = index === generatedEmails.length - 1;
}

document.addEventListener('DOMContentLoaded', function () {
 const inputs = document.querySelectorAll('input, textarea, select');
 inputs.forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.style.transform = 'translateY(-2px)';
  })
 input.addEventListener('blur', function(){
  this.parentElement.style.transform = 'translateY(0)';
  });
}); 
// Live Update of Recipient Count
const recipientField = document.getElementById('recipientEmails');
  if (recipientField) {
    recipientField.addEventListener('input', updateRecipientCount);
  }

  // Arrow navigation
  document.getElementById('prevEmail').onclick = function() {
    if (currentEmailIndex > 0) {
      currentEmailIndex--;
      showEmail(currentEmailIndex);
    }
  };
  document.getElementById('nextEmail').onclick = function() {
    if (currentEmailIndex < generatedEmails.length - 1) {
      currentEmailIndex++;
      showEmail(currentEmailIndex);
    }
  };
});

// Replace your generateEmails function with this 
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

  // Show "crafting" message
  output.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">✨</div>
      <p>Crafting your personalized marketing emails...</p>
    </div>
  `;

  try {
    const response = await fetch("http://localhost:5000/generate-emails", {
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

      // 👇 clear the "crafting" message after success
      output.innerHTML = "";

      if (selectedEmailVolume > 0) {
        document.getElementById('sendBtn').classList.add('active');
      }
    } else {
      throw new Error("No content generated");
    }
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

// Update your copyEmail function if needed 
function copyEmail(index) {
  const email = generatedEmails[index];
  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
  navigator.clipboard.writeText(fullEmail).then(() => {
    const btn = document.querySelector('.copy-btn');
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = 'var(--success-color)';
    btn.style.color = 'white';
    setTimeout(() => {
      btn.textContent = old;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
}
//Send Emails
// Send Emails
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
  const recipients = updateRecipientCount(); // <-- this gives us actual recipients

  if (!senderName || !senderEmail) {
    alert("Please enter your name and email.");
    return;
  }

  if (recipients.length === 0) {
    alert("Please enter at least one valid recipient email.");
    return;
  }

  const actualCount = recipients.length; // ✅ real number of emails being sent

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
        volume: actualCount, // ✅ send real count to backend too
        senderName,
        senderEmail,
        leadSource,
        productDescription: document.getElementById("userInput").value
      })
    });

    const data = await response.json();

    if (data.success) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
          progressText.textContent = `✅ Successfully sent ${actualCount.toLocaleString()} emails!`;
          progressCount.textContent = `${actualCount} / ${actualCount}`;
          sendBtn.innerHTML = '🎉 Campaign Completed!';
          sendBtn.style.background = 'linear-gradient(135deg, var(--success-color), #059669)';
          setTimeout(() => {
            progressSection.classList.remove('active');
            sendBtn.disabled = false;
            sendBtn.innerHTML = `Send ${selectedEmailVolume.toLocaleString()} Emails Now`;
            sendBtn.style.background = '';
            progressFill.style.width = '0%';
          }, 5000);
        } else {
          const sentSoFar = Math.round(progress * actualCount / 100);
          progressText.textContent = `Sending emails... ${Math.round(progress)}% complete`;
          progressCount.textContent = `${sentSoFar} / ${actualCount}`;
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
