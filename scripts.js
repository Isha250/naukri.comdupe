// Function to show the info in the container
function showInfo(category) {
    const infoContainer = document.getElementById('infoContainer');
    const infoText = document.getElementById('infoText');

    // Define the information for each category
    const infoData = {
        resume: "Naukri.com is an Indian job portal that connects job seekers with employers...",
        science: "Explore opportunities in Science and Research...",
        it: "Information Technology jobs are in high demand...",
        engineering: "Engineering offers diverse career paths...",
        finance: "Finance professionals manage money...",
        education: "Join the Education sector to shape minds...",
        marketing: "Marketing and Sales professionals are the bridge...",
        arts: "Arts and Entertainment offer creative careers...",
        hr: "Human Resources is all about managing people...",
        legal: "Legal careers involve upholding justice...",
        operations: "Operations and Logistics professionals ensure...",
        customer: "Customer Service roles are essential for...",
        healthcare: "Healthcare is a rapidly growing field..."
    };

    // Set the text and display the container
    infoText.textContent = infoData[category];
    infoContainer.style.display = 'block';
}

// Function to filter jobs based on the dropdown selection
function filterJobs() {
    const selectedJob = document.getElementById('jobDropdown').value.toLowerCase();
    const items = document.querySelectorAll('#itemList li');
    const itemList = document.getElementById('itemList');

    let hasResults = false;

    items.forEach(item => {
        if (item.textContent.toLowerCase().includes(selectedJob)) {
            item.style.display = 'list-item';
            hasResults = true;
        } else {
            item.style.display = 'none';
        }
    });

    // Show the job list only if there are matching results
    itemList.style.display = hasResults ? 'block' : 'none';
}

// Add event listener for the search button
document.getElementById('searchButton').addEventListener('click', filterJobs);
