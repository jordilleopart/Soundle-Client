// Select the parent container for the cards
const cardsContainer = document.querySelector('.cards');

// Add a single click event listener to the parent container
cardsContainer.addEventListener('click', (event) => {
    // Check if the clicked element is a card or a link inside a card
    const card = event.target.closest('.card');
    if (card) {
        // Get the link inside the clicked card
        const link = card.querySelector('a');
        
        // Optional: You can perform actions before navigating
        console.log('Card clicked:', link.href);
        
        // Navigate to the link's href (default action)
        window.location.href = link.href;
    }
});
