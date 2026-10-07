const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Insert Dashboard button
html = html.replace(
  '<input type="file" id="ppt-file" accept=".pptx,.ppt" style="display: none;">',
  '<button type="button" id="dashboard-btn" class="secondary-btn" style="margin-top:10px; font-size: 0.9em; margin-left: 10px;">🗂️ My Drafts</button>\n    <input type="file" id="ppt-file" accept=".pptx,.ppt" style="display: none;">'
);

// Insert Dashboard View
html = html.replace(
  '<form id="patent-form">',
  '<div id="dashboard-view" style="display: none;">\n      <h2>My Saved Drafts</h2>\n      <div id="drafts-list" style="display: flex; flex-direction: column; gap: 10px;">\n        <p>Loading...</p>\n      </div>\n      <button type="button" id="new-draft-btn" class="secondary-btn" style="margin-top: 20px;">+ Create New Draft</button>\n    </div>\n\n    <form id="patent-form">\n      <input type="hidden" id="draft-id" value="">\n      \n      <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">\n        <button type="button" id="save-draft-btn" class="secondary-btn">💾 Save Draft</button>\n      </div>'
);

fs.writeFileSync('public/index.html', html);
console.log('index.html updated');
