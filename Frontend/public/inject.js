// public/inject.js

(function() {
    // Find the script tag that loaded this script
    const scriptTag = document.currentScript;
    const agentId = scriptTag.getAttribute('data-agent-id');
    const apiKey = scriptTag.getAttribute('data-api-key'); // <<< NEW: Get API Key from script tag
    const themeConfigUrl = scriptTag.getAttribute('data-config-url'); // Optional theme config

    if (!agentId) {
        console.error("Oorjit AI Widget: 'data-agent-id' attribute is missing from the script tag. The widget will not load correctly.");
        return; // Essential for the widget to function
    }
    // It's good practice to log a warning if apiKey is missing, 
    // but the EmbedPage.jsx will handle the actual error/blocking if it's critical.
    if (!apiKey) { 
        console.warn("Oorjit AI Widget: 'data-api-key' attribute is missing from the script tag. Embedded chat might not function correctly without it.");
    }

    // --- Determine the Frontend Base URL ---
    // Use an environment variable for the frontend base URL in a production setup.
    // For local development, hardcoding 'http://localhost:5173' is fine.
    // In a real build process, this would be replaced.
    // Example: const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';
    // However, since this is a static JS file, we'll hardcode or derive carefully.
    // For simplicity, let's keep it hardcoded for local dev for now, as in previous versions.
    const frontendBaseUrl = 'http://localhost:5173';


    // --- Create the Chat Button ---
    const chatButton = document.createElement('button');
    chatButton.id = 'oorjit-chat-button';
    chatButton.style.position = 'fixed';
    chatButton.style.bottom = '20px';
    chatButton.style.right = '20px';
    chatButton.style.width = '60px';
    chatButton.style.height = '60px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.backgroundColor = '#3B82F6'; // Default color, can be overridden by theme
    chatButton.style.color = 'white'; // Ensure icon color is white
    chatButton.style.border = 'none';
    chatButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    chatButton.style.cursor = 'pointer';
    chatButton.style.display = 'flex';
    chatButton.style.alignItems = 'center';
    chatButton.style.justifyContent = 'center';
    chatButton.style.zIndex = '99999';
    chatButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>`;
    // Note: Changed stroke="white" to stroke="currentColor" and added chatButton.style.color = 'white'
    // to allow CSS to control the icon color more easily if needed.

    // --- Create the Iframe Container ---
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'oorjit-iframe-container';
    iframeContainer.style.position = 'fixed';
    iframeContainer.style.bottom = '90px'; // Position above the button
    iframeContainer.style.right = '20px';
    iframeContainer.style.width = '400px'; // Typical chat widget width
    iframeContainer.style.height = '600px'; // Typical chat widget height
    iframeContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    iframeContainer.style.borderRadius = '12px';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.display = 'none'; // Initially hidden
    iframeContainer.style.zIndex = '99998'; // Below the button
    iframeContainer.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Smooth transition
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'translateY(20px)'; // Start slightly below for animation
    
    // --- Create the Iframe ---
    const iframe = document.createElement('iframe');
    // Construct the iframe src. IMPORTANT: Pass apiKey as a query parameter.
    iframe.src = `${frontendBaseUrl}/embed/${agentId}${apiKey ? `?apiKey=${apiKey}` : ''}`; 
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none'; // Remove default iframe border
    iframe.style.backgroundColor = 'transparent'; // Allow background transparency if iframe content supports it

    iframeContainer.appendChild(iframe);
    document.body.appendChild(chatButton);
    document.body.appendChild(iframeContainer);

    // --- Toggle Logic ---
    let isOpen = false;
    chatButton.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframeContainer.style.display = 'block';
            // Trigger reflow to ensure transition works
            void iframeContainer.offsetWidth; 
            iframeContainer.style.opacity = '1';
            iframeContainer.style.transform = 'translateY(0)';
        } else {
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px)';
            // Hide after transition completes
            iframeContainer.addEventListener('transitionend', function handler() {
                if (!isOpen) { // Only hide if it's still closed
                    iframeContainer.style.display = 'none';
                }
                iframeContainer.removeEventListener('transitionend', handler);
            });
        }
    });

    // Optional: Fetch theme and apply it (if themeConfigUrl is provided)
    // This part would typically fetch a JSON configuration that might include colors, fonts, etc.
    if (themeConfigUrl) {
        fetch(themeConfigUrl)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(config => {
                // Apply primary color to button if available in config
                if (config.theme?.primaryColor) {
                    chatButton.style.backgroundColor = config.theme.primaryColor;
                }
                // You could add more theme customizations here (e.g., border-radius, fonts)
                // by dynamically injecting styles or passing them to the iframe via message.
            })
            .catch(err => console.error("Oorjit AI Widget: Failed to load theme configuration.", err));
    }
})();