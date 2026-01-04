// popup.js

let originalSrtContent = ""; // Stores the raw file content to allow repeated shifting

// 1. Handle File Upload
document.getElementById('srtFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        originalSrtContent = e.target.result; // Store the original raw SRT
        processAndInject(0); // Inject immediately with 0 shift
    };
    reader.readAsText(file);
});

// 2. Handle the "Sync & Apply" button click
document.getElementById('applyShift').addEventListener('click', () => {
    const shiftValue = parseFloat(document.getElementById('shiftAmount').value) || 0;
    if (originalSrtContent) {
        processAndInject(shiftValue);
    } else {
        document.getElementById('status').textContent = 'Please upload a file first.';
    }
});

// 3. The main workflow: Shift -> Convert to VTT -> Inject
function processAndInject(seconds) {
    try {
        // Step A: Shift timestamps (Logic from your shift.py)
        const shiftedSrt = shiftSrtLogic(originalSrtContent, seconds);
        
        // Step B: Convert the shifted SRT to VTT (Previous functionality)
        const vttContent = srtToVtt(shiftedSrt);
        
        document.getElementById('status').textContent = `Applied ${seconds}s shift. Injecting...`;

        // Step C: Send to the video player (Previous functionality)
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "injectSubtitles",
                    vtt: vttContent
                });
            }
        });
    } catch (error) {
        document.getElementById('status').textContent = 'Error: ' + error.message;
    }
}

/**
 * JavaScript implementation of your shift.py logic.
 * Finds timestamps (00:00:00,000) and adds the offset.
 */
function shiftSrtLogic(srt, seconds) {
    const msOffset = seconds * 1000;
    const timestampRegex = /(\d{2}:\d{2}:\d{2},\d{3})/g;

    return srt.replace(timestampRegex, (match) => {
        // Convert SRT timestamp to total milliseconds
        const parts = match.split(/[:,]/);
        let ms = (parseInt(parts[0]) * 3600000) + 
                 (parseInt(parts[1]) * 60000) + 
                 (parseInt(parts[2]) * 1000) + 
                 parseInt(parts[3]);

        // Apply shift and prevent negative time
        ms = Math.max(0, ms + msOffset);

        // Reformat back to HH:MM:SS,mmm
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        const mmm = Math.floor(ms % 1000).toString().padStart(3, '0');

        return `${h}:${m}:${s},${mmm}`;
    });
}

/**
 * Your existing SRT to VTT Converter function
 */
function srtToVtt(srt) {
    // 1. Replace commas with periods in timestamps
    let vtt = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    
    // 2. Add the VTT header
    vtt = 'WEBVTT\n\n' + vtt;

    // 3. Remove the line numbers
    vtt = vtt.replace(/^\d+\s*$/gm, '').trim(); 
    
    return vtt;
}