// popup.js

document.getElementById('srtFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const srtContent = e.target.result;
        try {
            const vttContent = srtToVtt(srtContent);
            document.getElementById('status').textContent = 'Subtitles loaded. Injecting...';
            
            // This is the key: we send a message to the content script in ALL tabs/frames
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "injectSubtitles",
                    vtt: vttContent
                });
            });

        } catch (error) {
            document.getElementById('status').textContent = 'Error converting SRT: ' + error.message;
        }
    };
    reader.readAsText(file);
});


// VERY BASIC SRT to VTT Converter function
// This function needs to be robust for a real-world app, but this is the minimum version.
function srtToVtt(srt) {
    // 1. Replace commas with periods in timestamps
    let vtt = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    
    // 2. Add the VTT header
    vtt = 'WEBVTT\n\n' + vtt;

    // 3. Remove the line numbers that appear before each cue's time signature.
    // This simple regex handles lines containing only digits before a newline.
    // This is the weakest point, as real SRT can be tricky.
    vtt = vtt.replace(/^\d+\s*$/gm, '').trim(); 
    
    return vtt;
}