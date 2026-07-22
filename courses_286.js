(function(){
    // Lightweight shim that populates window.coursesDatabase from c_c.csv if present.
    if (window.coursesDatabase && window.coursesDatabase.length) return;
    fetch('c_c.csv').then(r => r.ok ? r.text() : Promise.reject()).then(text => {
        const lines = text.trim().split(/\r?\n/).filter(Boolean);
        const headers = lines.shift().split(',').map(h=>h.trim());
        const items = lines.map(line => {
            const cols = line.split(',');
            const obj = {};
            headers.forEach((h,i)=> obj[h] = cols[i] ? cols[i].trim() : '');
            return {
                name: obj['Course Name'] || obj.name || '',
                duration: obj['Duration'] || '',
                description: obj['Short Description'] || obj['Course Name'] || '',
                category: obj['Category'] || 'General'
            };
        });
        window.coursesDatabase = items;
        if (typeof buildCoursesPanel === 'function') setTimeout(buildCoursesPanel, 40);
    }).catch(() => {
        window.coursesDatabase = window.coursesDatabase || [];
    });
})();
