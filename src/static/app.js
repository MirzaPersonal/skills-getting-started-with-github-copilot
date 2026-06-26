document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activityData = {};

  function renderActivities(activities) {
    activityData = activities;

    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = details.participants || [];
      const participantsList = participants.length
        ? participants
            .map(
              (email) => `
                <li class="participant-row">
                  <span>${email}</span>
                  <button class="participant-delete" data-activity="${name}" data-email="${email}" type="button" aria-label="Remove ${email}">
                    ✕
                  </button>
                </li>
              `
            )
            .join("")
        : '<li class="participant-row participant-row--empty">No participants yet</li>';

      activityCard.innerHTML = `
        <div class="activity-card__header">
          <h4>${name}</h4>
          <span class="activity-chip">${spotsLeft} left</span>
        </div>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <strong>Participants</strong>
          <ul class="participants-list">${participantsList}</ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");
    if (!deleteButton) return;

    const activityName = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        if (activityData[activityName] && Array.isArray(activityData[activityName].participants)) {
          const participantIndex = activityData[activityName].participants.indexOf(email);
          if (participantIndex !== -1) {
            activityData[activityName].participants.splice(participantIndex, 1);
          }
          renderActivities(activityData);
        } else {
          await fetchActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "Could not remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        if (activityData[activity] && Array.isArray(activityData[activity].participants)) {
          activityData[activity].participants.push(email);
          renderActivities(activityData);
        } else {
          await fetchActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
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

  // Initialize app
  fetchActivities();
});
