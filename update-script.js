const fs = require('fs');
let js = fs.readFileSync('public/script.js', 'utf8');

const jsAppend = `

  // --- Dashboard Logic ---
  const dashboardBtn = document.getElementById('dashboard-btn');
  const dashboardView = document.getElementById('dashboard-view');
  const patentForm = document.getElementById('patent-form');
  const newDraftBtn = document.getElementById('new-draft-btn');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const draftsList = document.getElementById('drafts-list');
  const draftIdInput = document.getElementById('draft-id');
  const accessCodeContainer = document.getElementById('access-code-container');

  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', async () => {
      dashboardView.style.display = 'block';
      patentForm.style.display = 'none';
      if (accessCodeContainer) accessCodeContainer.style.display = 'none';
      await loadDrafts();
    });

    newDraftBtn.addEventListener('click', () => {
      dashboardView.style.display = 'none';
      patentForm.style.display = 'block';
      if (accessCodeContainer) accessCodeContainer.style.display = 'block';
      patentForm.reset();
      draftIdInput.value = '';
    });

    saveDraftBtn.addEventListener('click', async () => {
      const payload = {
        id: draftIdInput.value || undefined,
        title: document.getElementById('title').value,
        problem: document.getElementById('problem').value,
        solution: document.getElementById('solution').value,
        components: document.getElementById('components').value,
        results: document.getElementById('results').value
      };
      saveDraftBtn.textContent = 'Saving...';
      try {
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save draft');
        const data = await res.json();
        draftIdInput.value = data.id;
        saveDraftBtn.textContent = '💾 Saved!';
        setTimeout(() => saveDraftBtn.textContent = '💾 Save Draft', 2000);
      } catch (err) {
        alert(err.message);
        saveDraftBtn.textContent = '💾 Save Draft';
      }
    });
  }

  async function loadDrafts() {
    draftsList.innerHTML = '<p>Loading...</p>';
    try {
      const res = await fetch('/api/drafts');
      const drafts = await res.json();
      if (drafts.length === 0) {
        draftsList.innerHTML = '<p>No saved drafts found.</p>';
        return;
      }
      draftsList.innerHTML = '';
      drafts.forEach(d => {
        const div = document.createElement('div');
        div.style = 'border: 1px solid #ddd; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: #fff;';
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = d.title || 'Untitled Draft';
        titleSpan.style.fontWeight = 'bold';
        
        const dateSpan = document.createElement('span');
        dateSpan.textContent = new Date(d.updated_at).toLocaleString();
        dateSpan.style.fontSize = '0.85em';
        dateSpan.style.color = '#777';
        dateSpan.style.marginLeft = '10px';
        
        const infoDiv = document.createElement('div');
        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(dateSpan);
        
        const actionsDiv = document.createElement('div');
        
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Edit';
        loadBtn.className = 'secondary-btn';
        loadBtn.style.padding = '5px 10px';
        loadBtn.style.fontSize = '0.85em';
        loadBtn.style.marginRight = '5px';
        loadBtn.onclick = () => loadDraft(d.id);
        
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.padding = '5px 10px';
        delBtn.style.fontSize = '0.85em';
        delBtn.style.background = '#d32f2f';
        delBtn.style.color = '#fff';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '4px';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = () => deleteDraft(d.id);
        
        actionsDiv.appendChild(loadBtn);
        actionsDiv.appendChild(delBtn);
        
        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        draftsList.appendChild(div);
      });
    } catch (err) {
      draftsList.innerHTML = '<p class="error">Failed to load drafts.</p>';
    }
  }

  async function loadDraft(id) {
    try {
      const res = await fetch('/api/drafts/' + id);
      const data = await res.json();
      
      draftIdInput.value = data.id;
      document.getElementById('title').value = data.title || '';
      document.getElementById('problem').value = data.problem || '';
      document.getElementById('solution').value = data.solution || '';
      document.getElementById('components').value = data.components || '';
      document.getElementById('results').value = data.results || '';
      
      trackChars('problem');
      trackChars('solution');
      
      dashboardView.style.display = 'none';
      patentForm.style.display = 'block';
      if (accessCodeContainer) accessCodeContainer.style.display = 'block';
    } catch (err) {
      alert('Failed to load draft');
    }
  }

  async function deleteDraft(id) {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await fetch('/api/drafts/' + id, { method: 'DELETE' });
      await loadDrafts();
    } catch (err) {
      alert('Failed to delete draft');
    }
  }
`;

fs.writeFileSync('public/script.js', js + jsAppend);
console.log('script.js updated');
