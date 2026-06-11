/* ═══════════════════════════════════════════════════════
   A10D — Attendance Platform · Client JS
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── CONFIG ────────────────────────────────────────────────
const API_BASE = '/api';
const STUDENT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const POLL_INTERVAL_MS = 2500;

// ── STATE ─────────────────────────────────────────────────
const State = {
  currentScreen: 'landing',
  teacher: {
    sessionCode: null,
    students: [],
    pollTimer: null,
  },
  student: {
    sessionCode: null,
    gpsCoords: null,
    gpsStatus: 'pending',
    cameraStatus: 'pending',
    cameraStream: null,
    timerInterval: null,
    timerStart: null,
    submitted: false,
  },
};

// ── UTILS ─────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function toast(msg, duration = 2500) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), duration);
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function fmtGPS(gps) {
  if (!gps || !gps.lat) return null;
  return `${parseFloat(gps.lat).toFixed(4)}, ${parseFloat(gps.lng).toFixed(4)}`;
}

async function apiFetch(endpoint, opts = {}) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── APP ROUTER ────────────────────────────────────────────
const App = {
  goTo(screenId) {
    const prev = document.querySelector('.screen.active');
    if (prev) {
      prev.classList.add('exit');
      prev.classList.remove('active');
      setTimeout(() => prev.classList.remove('exit'), 380);
    }
    const next = $(`screen-${screenId}`);
    if (!next) return;
    next.classList.add('active');
    State.currentScreen = screenId;

    // Cleanup side-effects
    if (screenId === 'landing') {
      Teacher._stopPolling();
      Student._stopTimer();
      Student._stopCamera();
    }
  },
};

// ── TEACHER ───────────────────────────────────────────────
const Teacher = {
  async startSession() {
    const btn = $('btn-start-session');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      const data = await apiFetch('/start-session', { method: 'POST', body: '{}' });
      State.teacher.sessionCode = data.code;
      State.teacher.students = [];

      $('display-code').textContent = data.code;
      $('empty-code').textContent = data.code;
      Teacher._renderTable();
      Teacher._updateStats();

      App.goTo('teacher-dashboard');
      Teacher._startPolling();
      toast(`Session ${data.code} started`);
    } catch (e) {
      toast('Failed to start session. Try again.');
    } finally {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  },

  _startPolling() {
    Teacher._stopPolling();
    State.teacher.pollTimer = setInterval(Teacher._poll, POLL_INTERVAL_MS);
    Teacher._poll();
  },

  _stopPolling() {
    if (State.teacher.pollTimer) {
      clearInterval(State.teacher.pollTimer);
      State.teacher.pollTimer = null;
    }
  },

  async _poll() {
    const code = State.teacher.sessionCode;
    if (!code) return;
    try {
      const data = await apiFetch(`/get-attendance?code=${code}`);
      // Merge: add new entries not already in local list
      const existingIds = new Set(State.teacher.students.map(s => s.id));
      const newEntries = data.students.filter(s => !existingIds.has(s.id));

      if (newEntries.length > 0) {
        State.teacher.students = data.students;
        Teacher._renderTable(newEntries.map(e => e.id));
        Teacher._updateStats();
      } else if (data.students.length !== State.teacher.students.length) {
        State.teacher.students = data.students;
        Teacher._renderTable();
        Teacher._updateStats();
      }
    } catch {
      // Session may have ended from another tab — stop polling silently
    }
  },

  _renderTable(highlightIds = []) {
    const tbody = $('attendance-tbody');
    const emptyRow = $('empty-row');
    const students = State.teacher.students;

    if (students.length === 0) {
      if (!emptyRow) {
        tbody.innerHTML = `
          <tr class="empty-row" id="empty-row">
            <td colspan="8">
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <p>Waiting for students…</p>
                <p class="empty-sub">Share code <strong id="empty-code">${State.teacher.sessionCode}</strong> with your class</p>
              </div>
            </td>
          </tr>`;
      }
      return;
    }

    const rows = students.map((s, i) => {
      const isNew = highlightIds.includes(s.id);
      const gpsStr = fmtGPS(s.gps);
      const gpsBadge = gpsStr
        ? `<span class="badge badge-green">✓ GPS</span>`
        : `<span class="badge badge-gray">No GPS</span>`;

      let camBadge;
      if (s.cameraStatus === 'Active') {
        camBadge = `<span class="badge badge-green">✓ Cam</span>`;
      } else if (s.cameraStatus === 'Manual Entry') {
        camBadge = `<span class="badge badge-manual">Manual</span>`;
      } else {
        camBadge = `<span class="badge badge-red">No Cam</span>`;
      }

      return `
        <tr class="${isNew ? 'new-entry' : ''}" data-id="${s.id}">
          <td>${i + 1}</td>
          <td class="td-name">${escHtml(s.name)}</td>
          <td class="td-roll">${escHtml(s.rollNumber)}</td>
          <td class="td-mobile">${escHtml(s.mobile)}</td>
          <td>${gpsBadge}</td>
          <td>${camBadge}</td>
          <td class="td-time">${formatTime(s.timestamp)}</td>
          <td>
            <button class="remove-btn" onclick="Teacher.removeStudent('${s.id}')" title="Remove">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = rows;
  },

  _updateStats() {
    const s = State.teacher.students;
    $('stat-count').textContent = s.length;
    $('stat-gps').textContent = s.filter(x => x.gps && x.gps.lat).length;
    $('stat-cam').textContent = s.filter(x => x.cameraStatus === 'Active').length;
  },

  async removeStudent(studentId) {
    const code = State.teacher.sessionCode;
    try {
      await apiFetch('/remove-student', {
        method: 'POST',
        body: JSON.stringify({ code, studentId }),
      });
      State.teacher.students = State.teacher.students.filter(s => s.id !== studentId);
      Teacher._renderTable();
      Teacher._updateStats();
      toast('Student removed');
    } catch (e) {
      toast('Failed to remove student');
    }
  },

  copyCode() {
    const code = State.teacher.sessionCode;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => toast(`Code ${code} copied`)).catch(() => toast(code));
  },

  endSession() {
    $('modal-end-confirm').style.display = 'flex';
  },

  closeEndModal() {
    $('modal-end-confirm').style.display = 'none';
  },

  async confirmEnd() {
    const code = State.teacher.sessionCode;
    Teacher.closeEndModal();
    Teacher._stopPolling();

    try {
      await apiFetch('/end-session', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    } catch { /* session may already be gone */ }

    // Hard reset state
    State.teacher.sessionCode = null;
    State.teacher.students = [];
    $('display-code').textContent = '------';

    toast('Session ended. All data purged.');
    App.goTo('teacher-start');
  },

  exportCSV() {
    const students = State.teacher.students;
    if (students.length === 0) { toast('No attendance to export'); return; }

    const code = State.teacher.sessionCode;
    const headers = ['#', 'Name', 'Roll Number', 'Mobile', 'GPS Latitude', 'GPS Longitude', 'Camera', 'Timestamp'];
    const rows = students.map((s, i) => [
      i + 1,
      s.name,
      s.rollNumber,
      s.mobile,
      s.gps?.lat ?? '',
      s.gps?.lng ?? '',
      s.cameraStatus,
      s.timestamp,
    ]);

    const csv = [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV downloaded');
  },

  shareAttendance() {
    const students = State.teacher.students;
    const code = State.teacher.sessionCode;

    let text = `📋 A10D Attendance — Session ${code}\n`;
    text += `Total Present: ${students.length}\n\n`;
    students.forEach((s, i) => {
      text += `${i + 1}. ${s.name} (${s.rollNumber})`;
      if (s.gps?.lat) text += ' 📍';
      if (s.cameraStatus === 'Active') text += ' 📷';
      text += '\n';
    });

    if (navigator.share) {
      navigator.share({ title: `A10D Attendance ${code}`, text }).catch(() => {});
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(wa, '_blank');
    }
  },

  openAddModal() {
    $('manual-name').value = '';
    $('manual-roll').value = '';
    $('manual-mobile').value = '';
    $('modal-add-student').style.display = 'flex';
    setTimeout(() => $('manual-name').focus(), 100);
  },

  closeAddModal() {
    $('modal-add-student').style.display = 'none';
  },

  async addStudentManually() {
    const name = $('manual-name').value.trim();
    const rollNumber = $('manual-roll').value.trim();
    const mobile = $('manual-mobile').value.trim();
    const code = State.teacher.sessionCode;

    if (!name || !rollNumber) { toast('Name and Roll Number required'); return; }

    try {
      const data = await apiFetch('/add-student', {
        method: 'POST',
        body: JSON.stringify({ code, name, rollNumber, mobile }),
      });
      State.teacher.students.push(data.entry);
      Teacher._renderTable([data.entry.id]);
      Teacher._updateStats();
      Teacher.closeAddModal();
      toast(`${name} added manually`);
    } catch (e) {
      toast(e.message || 'Failed to add student');
    }
  },
};

// ── STUDENT ───────────────────────────────────────────────
const Student = {
  onCodeInput(el) {
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  },

  async verifyCode() {
    const code = $('input-code').value.trim().toUpperCase();
    if (code.length !== 6) { toast('Enter a 6-character code'); return; }

    const btn = $('btn-verify-code');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await apiFetch(`/get-attendance?code=${code}`);
      State.student.sessionCode = code;
      State.student.submitted = false;

      // Show next phase
      $('card-identity').style.display = 'flex';
      $('perm-row').style.display = 'flex';
      $('timer-block').style.display = 'flex';
      $('btn-submit').style.display = 'flex';

      // Disable code entry
      $('input-code').disabled = true;
      btn.disabled = true;
      btn.textContent = '✓ Verified';
      btn.style.background = '#16a34a';

      Student._requestPermissions();
      Student._startTimer();

      // Focus name
      setTimeout(() => $('input-name').focus(), 300);
    } catch (e) {
      toast(e.message || 'Invalid or expired session code');
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  },

  _startTimer() {
    const TOTAL = STUDENT_WINDOW_MS / 1000;
    const circle = $('timer-circle');
    const circumference = 213.6;
    let remaining = TOTAL;

    State.student.timerStart = Date.now();

    const update = () => {
      const elapsed = (Date.now() - State.student.timerStart) / 1000;
      remaining = Math.max(0, TOTAL - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      const display = $('timer-display');

      if (display) {
        display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      // SVG ring progress
      const offset = circumference * (1 - remaining / TOTAL);
      if (circle) circle.style.strokeDashoffset = offset;

      const isUrgent = remaining <= 30;
      circle?.classList.toggle('urgent', isUrgent);
      display?.classList.toggle('urgent', isUrgent);

      if (remaining <= 0) {
        Student._stopTimer();
        if (!State.student.submitted) {
          toast('Time is up! Session window closed.');
          $('btn-submit').disabled = true;
          $('btn-submit').style.opacity = '0.4';
        }
      }
    };

    update();
    State.student.timerInterval = setInterval(update, 500);
  },

  _stopTimer() {
    if (State.student.timerInterval) {
      clearInterval(State.student.timerInterval);
      State.student.timerInterval = null;
    }
  },

  async _requestPermissions() {
    Student._requestGPS();
    Student._requestCamera();
  },

  _requestGPS() {
    const badge = $('gps-badge');
    const statusText = $('gps-status-text');

    if (!navigator.geolocation) {
      badge.textContent = 'N/A';
      badge.className = 'perm-badge denied';
      statusText.textContent = 'Not supported';
      State.student.gpsStatus = 'Not supported';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        State.student.gpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        State.student.gpsStatus = 'Granted';
        badge.textContent = 'Granted';
        badge.className = 'perm-badge granted';
        statusText.textContent = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      },
      err => {
        State.student.gpsStatus = 'Denied';
        badge.textContent = 'Denied';
        badge.className = 'perm-badge denied';
        statusText.textContent = 'Permission denied — attendance still allowed';
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  },

  async _requestCamera() {
    const badge = $('cam-badge');
    const statusText = $('cam-status-text');

    if (!navigator.mediaDevices?.getUserMedia) {
      badge.textContent = 'N/A';
      badge.className = 'perm-badge denied';
      statusText.textContent = 'Camera not available';
      State.student.cameraStatus = 'Not Available';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });

      State.student.cameraStream = stream;
      State.student.cameraStatus = 'Active';

      badge.textContent = 'Active';
      badge.className = 'perm-badge granted';
      statusText.textContent = 'Camera present — not recording';

      // Show preview
      const wrap = $('camera-preview-wrap');
      const feed = $('camera-feed');
      wrap.style.display = 'block';
      feed.srcObject = stream;
    } catch {
      State.student.cameraStatus = 'Denied';
      badge.textContent = 'Denied';
      badge.className = 'perm-badge denied';
      statusText.textContent = 'No camera detected';
    }
  },

  _stopCamera() {
    if (State.student.cameraStream) {
      State.student.cameraStream.getTracks().forEach(t => t.stop());
      State.student.cameraStream = null;
    }
    const feed = $('camera-feed');
    if (feed) feed.srcObject = null;
  },

  async submit() {
    if (State.student.submitted) return;

    const name = $('input-name').value.trim();
    const rollNumber = $('input-roll').value.trim();
    const mobile = $('input-mobile').value.trim();

    if (!name) { toast('Please enter your name'); $('input-name').focus(); return; }
    if (!rollNumber) { toast('Please enter your roll number'); $('input-roll').focus(); return; }

    const elapsed = Date.now() - State.student.timerStart;
    if (elapsed >= STUDENT_WINDOW_MS) {
      toast('Session window has closed. Contact your teacher.');
      return;
    }

    const btn = $('btn-submit');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      const payload = {
        code: State.student.sessionCode,
        name,
        rollNumber,
        mobile,
        gps: State.student.gpsCoords,
        cameraStatus: State.student.cameraStatus,
      };

      await apiFetch('/join-session', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      State.student.submitted = true;
      Student._stopTimer();
      Student._stopCamera();

      // Populate success screen
      const gpsStr = fmtGPS(State.student.gpsCoords);
      $('success-detail').innerHTML = `
        <div>Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${escHtml(name)}</div>
        <div>Roll No. &nbsp;&nbsp;&nbsp; ${escHtml(rollNumber)}</div>
        <div>Session &nbsp;&nbsp;&nbsp;&nbsp; ${State.student.sessionCode}</div>
        <div>GPS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${gpsStr || 'Not captured'}</div>
        <div>Camera &nbsp;&nbsp;&nbsp;&nbsp; ${State.student.cameraStatus}</div>
        <div>Time &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${new Date().toLocaleTimeString('en-IN', {hour12: false})}</div>
      `;

      App.goTo('student-success');
    } catch (e) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      toast(e.message || 'Failed to submit. Try again.');
    }
  },
};

// ── HTML ESCAPE ───────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── INIT ──────────────────────────────────────────────────
window.App = App;
window.Teacher = Teacher;
window.Student = Student;

// Prevent double-tap zoom on mobile
document.addEventListener('touchend', e => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
    e.preventDefault();
    e.target.click();
  }
}, { passive: false });

// Prevent scroll bounce on iOS for fixed screens
document.body.addEventListener('touchmove', e => {
  const scrollable = e.target.closest('.screen-body, .table-scroll');
  if (!scrollable) e.preventDefault();
}, { passive: false });
