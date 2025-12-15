document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML (include delete button for each participant)
        const participantsHtml = details.participants.length
          ? `<ul>${details.participants
              .map((p) => {
                const label = String(p);
                const initials = label
                  .split(/[\s@._-]+/)
                  .filter(Boolean)
                  .slice(0,2)
                  .map(s => s[0].toUpperCase())
                  .join("")
                  .slice(0,2);
                return `<li data-activity="${encodeURIComponent(name)}" data-email="${p}"><span class="participant-badge">${initials}</span><span class="participant-label">${label}</span><button class="participant-delete" data-activity="${name}" data-email="${p}" aria-label="Remove participant">✕</button></li>`;
              })
              .join("")}</ul>`
          : `<div class="empty">No participants yet</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        // refresh activities to show the new participant
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click for participant delete buttons
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.participant-delete');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;
    if (!activity || !email) return;

    if (!confirm(`Remove ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const result = await resp.json();
      if (resp.ok) {
        // refresh list to show updated participants and availability
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || result.message || 'Failed to remove participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      messageDiv.textContent = 'Failed to remove participant. Please try again.';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
