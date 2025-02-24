const address = "http://localhost:3000"

/* Function triggered on page load, to check we have access to the page */
document.addEventListener('DOMContentLoaded', function() {
    // Get the JWT token from local storage
    const token = localStorage.getItem('jwtToken');
});