document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.href = '/login.html';
      return;
    }
    document.getElementById('auth-controls').style.display = 'block';
    document.getElementById('welcome-text').textContent = 'Welcome, ' + data.username;
  } catch (err) {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  const form = document.getElementById('patent-form');
  const inventorsContainer = document.getElementById('inventors-container');
  const addInventorBtn = document.getElementById('add-inventor');
  const errorMsg = document.getElementById('error-msg');
  const submitBtn = document.getElementById('submit-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const resultPanel = document.getElementById('result-panel');
  const downloadAgainBtn = document.getElementById('download-again');
  const generateAnotherBtn = document.getElementById('generate-another');
  
  let currentBlobUrl = null;
  let accessCodeNeeded = false;

  // Check config
  fetch('/api/config')
    .then(r => r.json())
    .then(data => {
      if (data.needsCode) {
        document.getElementById('access-code-container').style.display = 'block';
        accessCodeNeeded = true;
      }
    }).catch(console.error);

  function createInventorRow(index, isLead = false) {
    const row = document.createElement('div');
    row.className = 'inventor-row';
    row.innerHTML = `
      <div>
        <label>Full Name ${isLead ? '(Lead)' : ''}</label>
        <input type="text" class="inv-name" required maxlength="80">
      </div>
      <div>
        <label>Email ${isLead ? '(@vit.edu required)' : ''}</label>
        <input type="email" class="inv-email" required maxlength="80">
      </div>
      <div>
        <label>Phone</label>
        <input type="tel" class="inv-phone" maxlength="20">
      </div>
      <div style="flex: 1 1 100%;">
        <label>Signature Image (Optional)</label>
        <input type="file" class="inv-sig" accept="image/*">
      </div>
      ${!isLead ? '<button type="button" class="remove-btn">✖</button>' : ''}
    `;

    if (!isLead) {
      row.querySelector('.remove-btn').addEventListener('click', () => {
        row.remove();
        updateAddButtonState();
      });
    }
    return row;
  }

  function initializeInventors() {
    inventorsContainer.innerHTML = '';
    inventorsContainer.appendChild(createInventorRow(1, true));
    inventorsContainer.appendChild(createInventorRow(2, false));
    updateAddButtonState();
  }

  function updateAddButtonState() {
    const rows = inventorsContainer.querySelectorAll('.inventor-row').length;
    addInventorBtn.style.display = rows >= 8 ? 'none' : 'inline-block';
  }

  addInventorBtn.addEventListener('click', () => {
    const rows = inventorsContainer.querySelectorAll('.inventor-row').length;
    if (rows < 8) {
      inventorsContainer.appendChild(createInventorRow(rows + 1, false));
      updateAddButtonState();
    }
  });

  initializeInventors();

  // Character counters
  const trackChars = (id) => {
    const el = document.getElementById(id);
    const count = document.getElementById(id + '-count');
    el.addEventListener('input', () => { count.textContent = el.value.length; });
  };
  trackChars('problem');
  trackChars('solution');

  const fillSampleBtn = document.getElementById('fill-sample-btn');
  if (fillSampleBtn) {
    fillSampleBtn.addEventListener('click', () => {
      document.getElementById('title').value = 'Smart Plant Monitoring and Automated Irrigation System Using IoT';
      document.getElementById('problem').value = 'Traditional farming and indoor plant care rely heavily on manual observation and scheduled watering, which often leads to either overwatering or underwatering. Current automated systems are expensive, use static timers rather than real-time soil data, and lack remote monitoring capabilities. As a result, farmers and hobbyists experience reduced crop yields, wasted water resources, and increased plant mortality rates due to inconsistent moisture levels and delayed responses to environmental changes.';
      document.getElementById('solution').value = 'We developed an IoT-based smart irrigation system that monitors soil moisture, temperature, and humidity in real-time. The system uses a network of low-cost sensors connected to a microcontroller. When the soil moisture drops below a specific threshold (calculated dynamically based on the current temperature and humidity), the microcontroller automatically triggers a water pump to irrigate the plant. It also sends real-time data to a cloud database, allowing users to monitor their plants and manually override the pump through a mobile dashboard.';
      document.getElementById('components').value = 'NodeMCU ESP8266 microcontroller, Capacitive Soil Moisture Sensor v1.2, DHT11 Temperature and Humidity Sensor, 5V Relay module, Mini Submersible Water Pump, Firebase Realtime Database, React Native mobile app.';
      document.getElementById('results').value = 'In a 4-week test on a small tomato crop, the system reduced water usage by 35% compared to daily scheduled watering, while maintaining optimal soil moisture (between 40% and 60%). No plants died from water stress during the testing period.';
      
      // Update character counts
      document.getElementById('problem-count').textContent = document.getElementById('problem').value.length;
      document.getElementById('solution-count').textContent = document.getElementById('solution').value.length;
      
      // Set lead inventor
      const rows = inventorsContainer.querySelectorAll('.inventor-row');
      if (rows.length > 0) {
        rows[0].querySelector('.inv-name').value = 'Test Student';
        rows[0].querySelector('.inv-email').value = 'test.student@vit.edu';
        rows[0].querySelector('.inv-phone').value = '1234567890';
      }
    });
  }

  const pptBtn = document.getElementById('upload-ppt-btn');
  const pptInput = document.getElementById('ppt-file');
  if (pptBtn && pptInput) {
    pptBtn.addEventListener('click', () => pptInput.click());
    pptInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('presentation', file);

      pptBtn.disabled = true;
      const originalText = pptBtn.textContent;
      pptBtn.textContent = '⏳ Extracting...';

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });
        
        if (res.status === 401) {
          window.location.href = '/login.html';
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to extract');
        }

        const data = await res.json();
        
        if (data.title && data.title !== '(none)') document.getElementById('title').value = data.title;
        if (data.problem) { document.getElementById('problem').value = data.problem; document.getElementById('problem-count').textContent = data.problem.length; }
        if (data.solution) { document.getElementById('solution').value = data.solution; document.getElementById('solution-count').textContent = data.solution.length; }
        if (data.components) document.getElementById('components').value = data.components;
        if (data.results) document.getElementById('results').value = data.results;

        alert('✨ Information extracted successfully! Please review and modify the fields before generating the patent draft.');
      } catch (err) {
        alert('Extraction error: ' + err.message);
      } finally {
        pptBtn.disabled = false;
        pptBtn.textContent = originalText;
        e.target.value = '';
      }
    });
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    
    submitBtn.disabled = true;
    loadingIndicator.style.display = 'block';

    try {
      const inventors = [];
      const rows = inventorsContainer.querySelectorAll('.inventor-row');
      for (const row of Array.from(rows)) {
        const sigFile = row.querySelector('.inv-sig').files[0];
        let sigBase64 = null;
        if (sigFile) {
          sigBase64 = await fileToBase64(sigFile);
        }
        inventors.push({
          name: row.querySelector('.inv-name').value,
          email: row.querySelector('.inv-email').value,
          phone: row.querySelector('.inv-phone').value,
          signature: sigBase64
        });
      }

      if (!inventors[0].email.toLowerCase().endsWith('@vit.edu')) {
        throw new Error('The lead inventor email must end with @vit.edu.');
      }

      const payload = {
        department: document.getElementById('department').value,
        title: document.getElementById('title').value,
        problem: document.getElementById('problem').value,
        solution: document.getElementById('solution').value,
        components: document.getElementById('components').value,
        results: document.getElementById('results').value,
        inventors
      };
    
    const headers = { 'Content-Type': 'application/json' };
    if (accessCodeNeeded) {
      const code = document.getElementById('access-code').value;
      if (code) headers['x-access-code'] = code;
    }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const blob = await res.blob();
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = URL.createObjectURL(blob);
      
      triggerDownload();

      form.style.display = 'none';
      resultPanel.style.display = 'block';
      window.scrollTo(0, 0);

    } catch (err) {
      errorMsg.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  });

  function triggerDownload() {
    const a = document.createElement('a');
    a.href = currentBlobUrl;
    a.download = 'Patent_Draft.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  downloadAgainBtn.addEventListener('click', triggerDownload);

  generateAnotherBtn.addEventListener('click', () => {
    document.getElementById('title').value = '';
    document.getElementById('problem').value = '';
    document.getElementById('solution').value = '';
    document.getElementById('components').value = '';
    document.getElementById('results').value = '';
    document.getElementById('problem-count').textContent = '0';
    document.getElementById('solution-count').textContent = '0';
    
    initializeInventors();
    
    resultPanel.style.display = 'none';
    form.style.display = 'block';
    window.scrollTo(0, 0);
  });
});


  // --- Dashboard Logic ---
  const dashboardBtn = document.getElementById('dashboard-btn');
  const dashboardView = document.getElementById('dashboard-view');
  const patentForm = document.getElementById('patent-form');
  const newDraftBtn = document.getElementById('new-draft-btn');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const draftsList = document.getElementById('drafts-list');
  const draftIdInput = document.getElementById('draft-id');
  const accessCodeContainer = document.getElementById('access-code-container');

  const navPlayground = document.getElementById('nav-playground');

  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', async () => {
      dashboardView.style.display = 'block';
      patentForm.style.display = 'none';
      dashboardBtn.classList.add('active');
      if (navPlayground) navPlayground.classList.remove('active');
      if (accessCodeContainer) accessCodeContainer.style.display = 'none';
      await loadDrafts();
    });

    if (navPlayground) {
      navPlayground.addEventListener('click', () => {
        dashboardView.style.display = 'none';
        patentForm.style.display = 'block';
        navPlayground.classList.add('active');
        dashboardBtn.classList.remove('active');
      });
    }

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
