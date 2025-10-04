// content.js

// 🚨 IMPORTANT: Change 'video' to the specific CSS selector for your video if possible
// e.g., 'video.main-player-element' or '#video-id-1'
const VIDEO_SELECTOR = 'video'; 

// Listener to receive the VTT content from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectSubtitles") {
        
        // 1. Find the video element using the known selector
        const videoElement = document.querySelector(VIDEO_SELECTOR);

        if (!videoElement) {
            console.warn("Simple Subtitle Injector: No video element found with selector:", VIDEO_SELECTOR);
            // In a real app, you'd send a message back to the popup with this status
            return; 
        }

        // 2. Create a local URL for the VTT data
        const blob = new Blob([request.vtt], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);

        // 3. Remove any existing custom track to prevent duplicates
        const existingTrack = videoElement.querySelector('track[label="Custom SRT"]');
        if (existingTrack) {
            existingTrack.remove();
        }

        // 4. Create and inject the native <track> element
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'Custom SRT';
        track.srclang = 'en';
        track.src = url;
        track.default = true; // Set as default for immediate display
        
        // Append the track to the video element
        videoElement.appendChild(track);

        // OPTIONAL: Force the track to show, in case the player doesn't automatically
        // This is necessary because setting 'default' isn't always enough.
        track.addEventListener('load', () => {
             // Find the TextTrack object and set its mode
             const textTracks = videoElement.textTracks;
             for (let i = 0; i < textTracks.length; i++) {
                 if (textTracks[i].label === 'Custom SRT') {
                     textTracks[i].mode = 'showing';
                     break;
                 }
             }
             // Clean up the URL when the track is finished/removed
             URL.revokeObjectURL(url);
        });

        console.log("Simple Subtitle Injector: Successfully injected custom track.");
    }
});