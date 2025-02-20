window.onload = function() {
    // Retrieve the HTTP status and custom message from sessionStorage
    const httpStatus = sessionStorage.getItem('httpStatus') || "Oops!";
    const customMessage = sessionStorage.getItem('customMessage') || "Something went wrong.";

    // Update the HTML elements with the status and custom message
    document.getElementById('status-code').innerText = `Error ${httpStatus}`;
    document.getElementById('error-message').innerText = customMessage;
    // Update the page title with the HTTP status code
    document.title = `Error ${httpStatus}`;
};
