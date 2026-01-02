// Quick script to check bug reports in localStorage
// Run this in browser console on localhost:5173

(async () => {
  const stored = await window.storage.get('bugreports', true);
  if (stored && stored.value) {
    const bugs = JSON.parse(stored.value);
    console.log(`Found ${bugs.length} bug reports in localStorage:`);
    bugs.forEach((bug, i) => {
      console.log(`\n--- Bug Report #${i + 1} ---`);
      console.log('Time:', new Date(bug.timestamp).toLocaleString());
      console.log('Description:', bug.description);
      console.log('Error:', bug.error);
      console.log('User:', bug.userEmail, bug.isGuestMode ? '(Guest)' : '(Logged in)');
      console.log('URL:', bug.url);
      console.log('Browser:', bug.userAgent);
    });
  } else {
    console.log('No bug reports found in localStorage');
  }
})();
