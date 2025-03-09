function applyJob() {
    alert("You have applied for this job!");
    // Add functionality to send the application data to your server or external link
}

function saveJob() {
    alert("Job saved!");
    // Add functionality to save the job listing to user's profile
}

function filterJobs() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const location = document.getElementById("locationFilter").value;
    const jobCards = document.getElementsByClassName("job-card");

    for (let i = 0; i < jobCards.length; i++) {
        const jobTitle = jobCards[i].getElementsByClassName("job-title")[0].textContent.toLowerCase();
        const jobLocation = jobCards[i].getElementsByClassName("job-location")[0].textContent;
        let show = true;

        if (input && !jobTitle.includes(input)) {
            show = false;
        }
        if (location && !jobLocation.includes(location)) {
            show = false;
        }

        jobCards[i].style.display = show ? "" : "none";
    }
}

function sortJobs() {
    const sortOption = document.getElementById("sortFilter").value;
    const jobListing = document.getElementById("jobListing");
    const jobCards = Array.from(jobListing.getElementsByClassName("job-card"));

    jobCards.sort((a, b) => {
        const dateA = parseDate(a.getElementsByClassName("job-posted")[0].textContent);
        const dateB = parseDate(b.getElementsByClassName("job-posted")[0].textContent);
        return sortOption === "recent" ? dateB - dateA : dateA - dateB;
    });

    jobCards.forEach(card => jobListing.appendChild(card));
}

function parseDate(dateString) {
    const now = new Date();
    if (dateString.includes("hour")) return now.getTime();
    if (dateString.includes("week")) return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    return now.getTime(); // Default to current time for simplicity
}
function toggleAppointmentForm() {
    var formContainer = document.getElementById('appointmentForm');
    if (formContainer.style.display === "none" || formContainer.style.display === "") {
        formContainer.style.display = "block";
    } else {
        formContainer.style.display = "none";
    }
}
