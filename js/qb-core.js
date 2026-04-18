/**
 * qb-core.js
 * All JavaScript logic for the Question Bank admin page.
 * Extracted from inline script in question-bank.html.
 *
 * Dependencies (expected on window):
 *   - fbGetCustomSkills(), fbSaveCustomSkill(id, data), fbDeleteCustomSkill(id)
 *   - VariableEditor class (variable-editor.js)
 *   - dynamic-gen.js helpers (extractTokens, extractNumbers, detectOperation, etc.)
 */

// ========================
// STATE
// ========================
const QBState = {
    activeTab: 'manual',
    aiQs: [],
    manQs: [],
    cloneQs: [],
    aiFileB64: null,
    aiFileMime: null,
    skillsCache: {},
    manFocusEl: null,
    manVisualType: 'none',
    manVisualSlot: 'question',
    manVisualSlots: {},
    variableEditors: {},
    manVarEditor: null,
    editingSkillId: null,
    editVarEditors: {}
};

// ========================
// UTILS
// ========================
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================
// TAB SWITCHING
// ========================
function qbTab(name, btn) {
    QBState.activeTab = name;
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabEl = document.getElementById('qb-tab-' + name);
    if (tabEl) tabEl.classList.add('active');
    if (name === 'ai') qbInitAIKey();
    if (name === 'clone') qbLoadBankDropdown();
}

// ========================
// PASTE TAB
// ========================
function qbProcessPaste() {
    const raw = document.getElementById('qb-paste-text').value.trim();
    const st = document.getElementById('qb-paste-status');
    if (!raw) { st.textContent = 'Paste some text first.'; st.className = 'admin-status err'; return; }
    QBState.pasteQs = qbParseText(raw);
    if (!QBState.pasteQs.length) { st.textContent = 'No questions found — check the format.'; st.className = 'admin-status err'; return; }
    st.textContent = QBState.pasteQs.length + ' question' + (QBState.pasteQs.length !== 1 ? 's' : '') + ' found.';
    st.className = 'admin-status ok';
    qbRenderQCards('qb-paste-preview', QBState.pasteQs, 'paste');
    document.getElementById('qb-paste-count').textContent = QBState.pasteQs.length;
    document.getElementById('qb-paste-save').style.display = 'block';
    // Init variable editor
    qbInitVariableEditor('paste', QBState.pasteQs);
}

function qbClearPaste() {
    document.getElementById('qb-paste-text').value = '';
    document.getElementById('qb-paste-status').textContent = '';
    document.getElementById('qb-paste-preview').innerHTML = '';
    document.getElementById('qb-paste-save').style.display = 'none';
    const veContainer = document.getElementById('qb-paste-ve');
    if (veContainer) veContainer.innerHTML = '';
    QBState.pasteQs = [];
    delete QBState.variableEditors['paste'];
}

async function qbSavePaste() {
    const name = document.getElementById('qb-paste-name').value.trim();
    const st = document.getElementById('qb-paste-save-status');
    if (!name) { st.textContent = 'Please enter a skill name.'; st.className = 'admin-status err'; return; }
    if (!QBState.pasteQs.length) { st.textContent = 'No questions to save.'; st.className = 'admin-status err'; return; }
    if (typeof fbSaveCustomSkill !== 'function') { st.textContent = 'Firebase not ready.'; st.className = 'admin-status err'; return; }
    const which = document.querySelector('input[name="qb-paste-which"]:checked').value;
    const cat = document.getElementById('qb-paste-cat').value;
    const grade = document.getElementById('qb-paste-grade').value;
    const anchor = document.getElementById('qb-paste-anchor').value.trim();
    const veDesc = _getVariableDescriptor('paste');
    st.innerHTML = '<span class="admin-loading"></span> Saving...'; st.className = 'admin-status';
    try {
        if (which === 'all') {
            await qbDoSave(name, anchor, cat, grade, QBState.pasteQs, veDesc);
        } else {
            for (let i = 0; i < QBState.pasteQs.length; i++) {
                await qbDoSave(name + ' ' + (i + 1), anchor, cat, grade, [QBState.pasteQs[i]], veDesc);
            }
        }
        st.textContent = 'Saved! Questions are now in your Question Bank.';
        st.className = 'admin-status ok';
        await qbLoadSkills();
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

// ========================
// AI TAB
// ========================
function qbInitAIKey() {
    const stored = localStorage.getItem('mathsite_gemini_key') || '';
    const el = document.getElementById('qb-ai-key');
    if (el) el.value = stored;
    const st = document.getElementById('qb-ai-key-status');
    if (st) {
        st.textContent = stored ? 'Key loaded from storage.' : '';
        st.className = stored ? 'admin-status ok' : 'admin-status';
    }
}

function qbSaveAIKey() {
    const key = document.getElementById('qb-ai-key').value.trim();
    const st = document.getElementById('qb-ai-key-status');
    if (!key) { st.textContent = 'Enter a key first.'; st.className = 'admin-status err'; return; }
    localStorage.setItem('mathsite_gemini_key', key);
    st.textContent = 'Key saved!'; st.className = 'admin-status ok';
}

function qbAIFileSelect(e) {
    const f = e.target.files[0]; if (!f) return;
    qbLoadAIFile(f);
}

function qbAIFileDrop(e) {
    const f = e.dataTransfer?.files?.[0]; if (!f) return;
    qbLoadAIFile(f);
}

function qbLoadAIFile(file) {
    QBState.aiFileMime = file.type;
    const reader = new FileReader();
    reader.onload = ev => {
        const dataUrl = ev.target.result;
        QBState.aiFileB64 = dataUrl.split(',')[1];
        document.getElementById('qb-ai-file-label').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
        document.getElementById('qb-ai-file-clear').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function qbAIClearFile() {
    QBState.aiFileB64 = null; QBState.aiFileMime = null;
    document.getElementById('qb-ai-file-label').textContent = 'Click or drag a file here';
    document.getElementById('qb-ai-file-clear').style.display = 'none';
    document.getElementById('qb-ai-file').value = '';
}

function _buildOutputFormat(qtype, qty) {
    if (qtype === 'oe') {
        return `Output ONLY in this exact format with no extra text or markdown:

1) [question text]
Answer: [exact numeric or simplified answer]

2) [question text]
Answer: [exact answer]

[continue for all ${qty} questions]

Rules:
- Write fractions as 3/8 or 1/2 (not special characters)
- Use \u00d7 for multiply, \u00f7 for divide, \u00b2 for squared, \u221a for square root
- Answers must be exact numbers, fractions, or simple expressions
- Do not include units unless essential to the answer
- Do not include any explanation, preamble, or markdown`;
    } else if (qtype === 'mixed') {
        return `Output ONLY in this exact format with no extra text or markdown. Mix multiple choice and open ended questions:

For multiple choice questions:
1) [question text]
A) [option]
B) [option]
C) [option]
D) [option]

For open ended questions:
2) [question text]
Answer: [exact numeric answer]

[continue for all ${qty} questions, mixing both types]

ANSWERS
[list correct letters for MC questions ONLY, in order \u2014 skip OE questions entirely]

Rules:
- Write fractions as 3/8 or 1/2 (not special characters)
- Use \u00d7 for multiply, \u00f7 for divide, \u00b2 for squared, \u221a for square root
- Make MC wrong answers plausible (common mistakes, off-by-one errors)
- OE answers must be exact numbers or fractions
- Do not include any explanation, preamble, or markdown`;
    } else {
        return `Output ONLY in this exact format with no extra text or markdown:

1) [question text]
A) [option]
B) [option]
C) [option]
D) [option]

[continue for all ${qty} questions]

ANSWERS
[letter for Q1], [letter for Q2], ...

Rules:
- Write fractions as 3/8 or 1/2 (not special characters)
- Use \u00d7 for multiply, \u00f7 for divide, \u00b2 for squared, \u221a for square root
- Make wrong answers plausible (common mistakes, off-by-one errors)
- Each question must have exactly one correct answer
- Do not include any explanation, preamble, or markdown \u2014 only the questions and ANSWERS section`;
    }
}

async function qbGenerateAI() {
    const apiKey = localStorage.getItem('mathsite_gemini_key') || document.getElementById('qb-ai-key').value.trim();
    const st = document.getElementById('qb-ai-status');
    if (!apiKey) { st.textContent = 'Enter and save your Gemini API key first.'; st.className = 'admin-status err'; return; }
    const qty = parseInt(document.getElementById('qb-ai-qty').value) || 5;

    st.innerHTML = '<span class="admin-loading"></span> Generating...'; st.className = 'admin-status';
    document.getElementById('qb-ai-preview').innerHTML = '';
    document.getElementById('qb-ai-save').style.display = 'none';

    const qtype = document.getElementById('qb-ai-qtype')?.value || 'mc';
    const outputFormat = _buildOutputFormat(qtype, qty);
    const parts = [];

    // Custom prompt mode
    const prompt = document.getElementById('qb-ai-prompt').value.trim();
    if (!prompt && !QBState.aiFileB64) { st.textContent = 'Enter a prompt or upload a file.'; st.className = 'admin-status err'; return; }
    if (QBState.aiFileB64) {
        if (QBState.aiFileMime === 'application/pdf') {
            parts.push({ inlineData: { mimeType: 'application/pdf', data: QBState.aiFileB64 } });
        } else if (QBState.aiFileMime && QBState.aiFileMime.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: QBState.aiFileMime, data: QBState.aiFileB64 } });
        }
    }
    const typeLabel = qtype === 'oe' ? 'open-ended numeric' : qtype === 'mixed' ? 'mixed multiple-choice and open-ended numeric' : 'multiple-choice';
    const systemPrompt = `You are a math teacher creating ${qty} ${typeLabel} questions. ${outputFormat}`;
    const userText = prompt || `Extract and create ${qty} ${typeLabel} math questions from the provided file.`;
    parts.push({ text: systemPrompt + '\n\n' + userText });

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error?.message || 'Gemini API error');
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('No text in response');
        QBState.aiQs = qbParseText(text);
        if (!QBState.aiQs.length) throw new Error('Could not parse questions from response');
        st.textContent = QBState.aiQs.length + ' question' + (QBState.aiQs.length !== 1 ? 's' : '') + ' generated!';
        st.className = 'admin-status ok';
        qbRenderQCards('qb-ai-preview', QBState.aiQs, 'ai');
        document.getElementById('qb-ai-count').textContent = QBState.aiQs.length;
        document.getElementById('qb-ai-save').style.display = 'block';
        qbInitVariableEditor('ai', QBState.aiQs);
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

async function qbSaveAI() {
    const name = document.getElementById('qb-ai-name').value.trim();
    const st = document.getElementById('qb-ai-save-status');
    if (!name) { st.textContent = 'Please enter a skill name.'; st.className = 'admin-status err'; return; }
    if (!QBState.aiQs.length) { st.textContent = 'No questions to save.'; st.className = 'admin-status err'; return; }
    if (typeof fbSaveCustomSkill !== 'function') { st.textContent = 'Firebase not ready.'; st.className = 'admin-status err'; return; }
    const which = document.querySelector('input[name="qb-ai-which"]:checked').value;
    const cat = document.getElementById('qb-ai-cat').value.trim();
    const grade = document.getElementById('qb-ai-grade').value.trim();
    const anchor = document.getElementById('qb-ai-anchor').value.trim();
    const cls = (document.getElementById('qb-ai-class') || {}).value || '';
    const chapter = (document.getElementById('qb-ai-chapter') || {}).value || '';
    const veDesc = _getVariableDescriptor('ai');
    st.innerHTML = '<span class="admin-loading"></span> Saving...'; st.className = 'admin-status';
    try {
        if (which === 'all') {
            await qbDoSave(name, anchor, cat, grade, QBState.aiQs, veDesc, cls.trim(), chapter.trim());
        } else {
            for (let i = 0; i < QBState.aiQs.length; i++) {
                await qbDoSave(name + ' ' + (i + 1), anchor, cat, grade, [QBState.aiQs[i]], veDesc, cls.trim(), chapter.trim());
            }
        }
        st.textContent = 'Saved! Questions are now in your Question Bank.';
        st.className = 'admin-status ok';
        await qbLoadSkills();
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

// ========================
// CLONE TAB
// ========================
async function qbLoadBankDropdown() {
    const sel = document.getElementById('qb-clone-bank-select') || document.getElementById('qb-ai-bank-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— loading... —</option>';
    try {
        let retries = 0;
        while (typeof fbGetCustomSkills !== 'function' && retries++ < 20) {
            await new Promise(r => setTimeout(r, 200));
        }
        if (typeof fbGetCustomSkills !== 'function') { sel.innerHTML = '<option value="">Firebase not ready</option>'; return; }
        const skills = await fbGetCustomSkills();
        const entries = Object.entries(skills || {});
        if (!entries.length) { sel.innerHTML = '<option value="">— No saved banks yet —</option>'; return; }
        entries.sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''));
        sel.innerHTML = '<option value="">— select a saved bank —</option>' +
            entries.map(([id, s]) => {
                const qCount = (s.questions || []).length;
                const grade = s.grade ? ' \u00b7 Gr ' + s.grade : '';
                return `<option value="${id}">${escHtml(s.name || id)} (${qCount}Q${grade})</option>`;
            }).join('');
        entries.forEach(([id, s]) => { QBState.skillsCache[id] = s; });
    } catch (e) {
        sel.innerHTML = '<option value="">— error loading —</option>';
    }
}

function qbOnBankSelect() {
    const sel = document.getElementById('qb-clone-bank-select') || document.getElementById('qb-ai-bank-select');
    const id = sel ? sel.value : '';
    const preview = document.getElementById('qb-clone-bank-preview');
    if (!id || !QBState.skillsCache[id]) { if (preview) preview.style.display = 'none'; return; }
    const s = QBState.skillsCache[id];
    const qs = s.questions || [];
    document.getElementById('qb-clone-qty').value = qs.length || 5;
    preview.style.display = 'block';
    preview.innerHTML = `<strong>${escHtml(s.name)}</strong> \u2014 ${qs.length} question${qs.length !== 1 ? 's' : ''}, Grade ${s.grade || '?'}, ${s.category || 'custom'}<br>` +
        qs.slice(0, 3).map((q, i) => `<span style="color:var(--text-main);">Q${i + 1}:</span> ${escHtml((q.text || '').slice(0, 70))}${(q.text || '').length > 70 ? '\u2026' : ''}`).join('<br>') +
        (qs.length > 3 ? `<br><em>\u2026and ${qs.length - 3} more</em>` : '');
    // Pre-fill save form
    const nameEl = document.getElementById('qb-clone-name');
    if (nameEl && !nameEl.value) nameEl.value = (s.name || '') + ' (Clone)';
    const catEl = document.getElementById('qb-clone-cat');
    const gradeEl = document.getElementById('qb-clone-grade');
    const anchorEl = document.getElementById('qb-clone-anchor');
    if (catEl && s.category) catEl.value = s.category;
    if (gradeEl && s.grade) gradeEl.value = s.grade;
    if (anchorEl && s.anchor) anchorEl.value = s.anchor;
}

async function qbGenerateClone() {
    const apiKey = localStorage.getItem('mathsite_gemini_key') || '';
    const st = document.getElementById('qb-clone-status');
    if (!apiKey) { st.textContent = 'Save your Gemini API key in the AI tab first.'; st.className = 'admin-status err'; return; }
    const qty = parseInt(document.getElementById('qb-clone-qty').value) || 5;
    const bankSel = document.getElementById('qb-clone-bank-select');
    const bankId = bankSel ? bankSel.value : '';
    if (!bankId || !QBState.skillsCache[bankId]) {
        st.textContent = 'Select a question bank to clone first.'; st.className = 'admin-status err'; return;
    }
    const bank = QBState.skillsCache[bankId];
    const sourceQs = bank.questions || [];
    if (!sourceQs.length) {
        st.textContent = 'Selected bank has no questions.'; st.className = 'admin-status err'; return;
    }

    st.innerHTML = '<span class="admin-loading"></span> Generating clone...'; st.className = 'admin-status';
    document.getElementById('qb-clone-preview').innerHTML = '';
    const cloneSave = document.getElementById('qb-clone-save');
    if (cloneSave) cloneSave.style.display = 'none';

    const qtype = 'mc'; // Clone uses source type by default
    const outputFormat = _buildOutputFormat(qtype, qty);

    const qList = sourceQs.map((q, i) => {
        let txt = `Q${i + 1}: ${q.text}`;
        if (q.options && q.options.length) txt += '\n' + q.options.join('\n');
        if (q.correct) txt += '\nCorrect: ' + q.correct;
        return txt;
    }).join('\n\n');

    const typeDesc = 'multiple-choice';
    const clonePrompt = `You are a math teacher. Below are ${sourceQs.length} questions from the question bank "${bank.name}". ` +
        `Create exactly ${qty} NEW ${typeDesc} questions that test the EXACT SAME math skill and SAME difficulty, ` +
        `but use completely different numbers, values, and scenarios. Do NOT reuse any numbers or wording from the originals.\n\n` +
        `ORIGINAL QUESTIONS:\n${qList}\n\n${outputFormat}`;

    const parts = [{ text: clonePrompt }];

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error?.message || 'Gemini API error');
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('No text in response');
        QBState.cloneQs = qbParseText(text);
        if (!QBState.cloneQs.length) throw new Error('Could not parse questions from response');
        st.textContent = QBState.cloneQs.length + ' question' + (QBState.cloneQs.length !== 1 ? 's' : '') + ' generated!';
        st.className = 'admin-status ok';
        qbRenderQCards('qb-clone-preview', QBState.cloneQs, 'clone');
        const countEl = document.getElementById('qb-clone-count');
        if (countEl) countEl.textContent = QBState.cloneQs.length;
        if (cloneSave) cloneSave.style.display = 'block';
        qbInitVariableEditor('clone', QBState.cloneQs);
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

async function qbSaveClone() {
    const name = document.getElementById('qb-clone-name').value.trim();
    const st = document.getElementById('qb-clone-save-status');
    if (!name) { st.textContent = 'Please enter a skill name.'; st.className = 'admin-status err'; return; }
    if (!QBState.cloneQs.length) { st.textContent = 'No questions to save.'; st.className = 'admin-status err'; return; }
    if (typeof fbSaveCustomSkill !== 'function') { st.textContent = 'Firebase not ready.'; st.className = 'admin-status err'; return; }
    const cat = document.getElementById('qb-clone-cat').value.trim();
    const grade = document.getElementById('qb-clone-grade').value.trim();
    const anchor = document.getElementById('qb-clone-anchor').value.trim();
    const cls = (document.getElementById('qb-clone-class') || {}).value || '';
    const chapter = (document.getElementById('qb-clone-chapter') || {}).value || '';
    const veDesc = _getVariableDescriptor('clone');
    st.innerHTML = '<span class="admin-loading"></span> Saving...'; st.className = 'admin-status';
    try {
        await qbDoSave(name, anchor, cat, grade, QBState.cloneQs, veDesc, cls.trim(), chapter.trim());
        st.textContent = 'Saved! Questions are now in your Question Bank.';
        st.className = 'admin-status ok';
        await qbLoadSkills();
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

// ========================
// MANUAL TAB
// ========================
function qbInsertSym(sym) {
    const el = QBState.manFocusEl || document.getElementById('qb-man-q');
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const val = el.value;
    el.value = val.slice(0, start) + sym + val.slice(end);
    el.setSelectionRange(start + sym.length, start + sym.length);
    el.focus();
}

function qbManToggleType() {
    const isOE = document.getElementById('qb-man-type-oe').checked;
    document.getElementById('qb-man-mc-section').style.display = isOE ? 'none' : '';
    document.getElementById('qb-man-oe-section').style.display = isOE ? '' : 'none';
    document.querySelectorAll('.qb-vis-slot-mc').forEach(b => b.style.display = isOE ? 'none' : '');
    document.getElementById('qb-vis-slot-answer').style.display = isOE ? '' : 'none';
    if (isOE && ['A', 'B', 'C', 'D'].includes(QBState.manVisualSlot)) {
        qbManVisualSlot('question', document.getElementById('qb-vis-slot-q'));
    } else if (!isOE && QBState.manVisualSlot === 'answer') {
        qbManVisualSlot('question', document.getElementById('qb-vis-slot-q'));
    }
}

// ===== MANUAL TAB: VARIABLE EDITOR (always active) =====
function qbManInitEditor() {
    const veEl = document.getElementById('qb-man-ve');
    if (!veEl || typeof VariableEditor !== 'function') return;
    veEl.innerHTML = '';
    const editor = new VariableEditor(veEl, {
        onChange: function () {
            QBState.manVarEditor = editor;
            // Sync visual slot bar with question type
            const isOE = editor.questionType === 'oe';
            document.querySelectorAll('.qb-vis-slot-mc').forEach(b => b.style.display = isOE ? 'none' : '');
            const ansBtn = document.getElementById('qb-vis-slot-answer');
            if (ansBtn) ansBtn.style.display = isOE ? '' : 'none';
            if (isOE && ['A', 'B', 'C', 'D'].includes(QBState.manVisualSlot)) {
                qbManVisualSlot('question', document.getElementById('qb-vis-slot-q'));
            } else if (!isOE && QBState.manVisualSlot === 'answer') {
                qbManVisualSlot('question', document.getElementById('qb-vis-slot-q'));
            }
        }
    });
    editor.loadQuestion('', '', [], '');
    QBState.manVarEditor = editor;
}

function qbManAddQuestion() {
    const st = document.getElementById('qb-man-status');

    if (!QBState.manVarEditor) { st.textContent = 'Editor not ready.'; st.className = 'admin-status err'; return; }
    const guide = (QBState.manVarEditor.guideTemplate || '').trim();

    const editor = QBState.manVarEditor;
    const qTemplate = editor.questionTemplate.trim();
    if (!qTemplate) { st.textContent = 'Question template is required.'; st.className = 'admin-status err'; return; }

    // Get the descriptor
    const varDesc = editor.getDescriptor();

    // Generate a sample to validate it works
    try {
        const sample = generateFromDescriptor(varDesc);
        if (!sample.ans && !sample.q) { st.textContent = 'Could not generate a question. Check your variables.'; st.className = 'admin-status err'; return; }
    } catch(e) {
        st.textContent = 'Error: ' + e.message; st.className = 'admin-status err'; return;
    }

    // Collect visual aids for all slots
    QBState.manVisualSlots[QBState.manVisualSlot] = QBState.manVisualType !== 'none' ? qbBuildVisualConfig() : { type: 'none' };

    let visualHTML = '';
    let optionVisuals = null;
    let answerVisual = null;

    // Question visual
    const qVis = QBState.manVisualSlots['question'];
    if (qVis && qVis.type !== 'none') {
        visualHTML = qbRenderVisualSVG(qVis);
    }

    // Option visuals (A, B, C, D) for MC
    const isOE = varDesc.questionType === 'oe';
    if (!isOE) {
        const ov = {};
        let hasAny = false;
        ['A', 'B', 'C', 'D'].forEach(letter => {
            const cfg = QBState.manVisualSlots[letter];
            if (cfg && cfg.type !== 'none') {
                ov[letter] = { config: cfg, visualHTML: qbRenderVisualSVG(cfg) };
                hasAny = true;
            }
        });
        if (hasAny) optionVisuals = ov;
    }

    // Answer visual (OE)
    if (isOE) {
        const aCfg = QBState.manVisualSlots['answer'];
        if (aCfg && aCfg.type !== 'none') {
            answerVisual = { config: aCfg, visualHTML: qbRenderVisualSVG(aCfg) };
        }
    }

    // Store the template text as the question text (it will be regenerated with real values when added to test)
    QBState.manQs.push({
        text: qTemplate,
        options: [],
        correct: '',
        guide: guide,
        openEnded: isOE,
        isCustom: true,
        variableDescriptor: varDesc,
        visualHTML: visualHTML,
        optionVisuals: optionVisuals,
        answerVisual: answerVisual
    });

    st.textContent = 'Added! Total: ' + QBState.manQs.length; st.className = 'admin-status ok';

    // Reset editor and visuals
    QBState.manVisualType = 'none';
    QBState.manVisualSlot = 'question';
    QBState.manVisualSlots = {};
    qbRestoreVisualConfig({ type: 'none' });
    document.querySelectorAll('.qb-vis-slot-btn').forEach(b => b.classList.remove('active', 'has-vis'));
    const qSlotBtn = document.getElementById('qb-vis-slot-q');
    if (qSlotBtn) qSlotBtn.classList.add('active');
    qbManInitEditor();

    qbRenderQCards('qb-man-preview', QBState.manQs, 'man');
    if (QBState.manQs.length > 0) document.getElementById('qb-man-save').style.display = 'block';
}

function qbManCopy(idx) {
    const q = QBState.manQs[idx];
    if (!q) return;

    // Load the variable descriptor into the editor (guide is inside the editor now)
    if (q.variableDescriptor && QBState.manVarEditor) {
        QBState.manVarEditor.setFromDescriptor(q.variableDescriptor);
    } else if (QBState.manVarEditor) {
        QBState.manVarEditor.loadQuestion(q.text || '', q.correct || '', q.options || [], q.guide || '');
    }

    // Make sure manual tab is active
    const manTabBtn = document.querySelector('.admin-tab[onclick*="manual"]');
    if (manTabBtn && !manTabBtn.classList.contains('active')) qbTab('manual', manTabBtn);

    const veEl = document.getElementById('qb-man-ve');
    if (veEl) veEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const st = document.getElementById('qb-man-status');
    st.textContent = 'Copied! Modify and click "Add to List" to create a variation.';
    st.className = 'admin-status ok';
}

async function qbSaveManual() {
    const name = document.getElementById('qb-man-name').value.trim();
    const st = document.getElementById('qb-man-save-status');
    if (!name) { st.textContent = 'Please enter a skill name.'; st.className = 'admin-status err'; return; }
    if (!QBState.manQs.length) { st.textContent = 'Add at least one question first.'; st.className = 'admin-status err'; return; }
    if (typeof fbSaveCustomSkill !== 'function') { st.textContent = 'Firebase not ready.'; st.className = 'admin-status err'; return; }
    const cat = document.getElementById('qb-man-cat').value.trim();
    const grade = document.getElementById('qb-man-grade').value.trim();
    const anchor = document.getElementById('qb-man-anchor').value.trim();
    const cls = (document.getElementById('qb-man-class') || {}).value || '';
    const chapter = (document.getElementById('qb-man-chapter') || {}).value || '';
    st.innerHTML = '<span class="admin-loading"></span> Saving...'; st.className = 'admin-status';
    try {
        await qbDoSave(name, anchor, cat, grade, QBState.manQs, null, cls.trim(), chapter.trim());
        st.textContent = 'Saved! Template is now in your Question Bank.';
        st.className = 'admin-status ok';
        QBState.manQs = [];
        document.getElementById('qb-man-preview').innerHTML = '';
        document.getElementById('qb-man-save').style.display = 'none';
        await qbLoadSkills();
    } catch (e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'admin-status err';
    }
}

// ========================
// VISUAL AIDS
// ========================
function qbManVisualSlot(slot, btn) {
    QBState.manVisualSlots[QBState.manVisualSlot] = QBState.manVisualType !== 'none' ? qbBuildVisualConfig() : { type: 'none' };
    QBState.manVisualSlot = slot;
    document.querySelectorAll('.qb-vis-slot-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const saved = QBState.manVisualSlots[slot];
    qbRestoreVisualConfig(saved && saved.type !== 'none' ? saved : { type: 'none' });
}

function _qbUpdateSlotIndicators() {
    const slotIds = { question: 'qb-vis-slot-q', A: 'qb-vis-slot-A', B: 'qb-vis-slot-B', C: 'qb-vis-slot-C', D: 'qb-vis-slot-D', answer: 'qb-vis-slot-answer' };
    Object.entries(slotIds).forEach(([key, id]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const cfg = key === QBState.manVisualSlot
            ? (QBState.manVisualType !== 'none' ? { type: QBState.manVisualType } : { type: 'none' })
            : (QBState.manVisualSlots[key] || { type: 'none' });
        btn.classList.toggle('has-vis', cfg.type !== 'none');
    });
}

function qbManVisualType(type, btn) {
    QBState.manVisualType = type;
    document.querySelectorAll('.qb-vis-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['numberline', 'shape', 'inequality', 'coordinate'].forEach(t => {
        const el = document.getElementById('qb-vis-cfg-' + t);
        if (el) el.style.display = (type === t) ? '' : 'none';
    });
    if (type !== 'none') qbManUpdateVisualPreview();
    _qbUpdateSlotIndicators();
}

function qbManUpdateVisualPreview() {
    if (QBState.manVisualType === 'none') return;
    const cfg = qbBuildVisualConfig();
    const svg = qbRenderVisualSVG(cfg);
    const el = document.getElementById('qb-vis-preview-' + QBState.manVisualType);
    if (el) el.innerHTML = svg;
}

function qbBuildVisualConfig() {
    const t = QBState.manVisualType;
    if (t === 'numberline') {
        const start = parseFloat(document.getElementById('qb-vis-nl-start').value);
        const end = parseFloat(document.getElementById('qb-vis-nl-end').value);
        const step = parseFloat(document.getElementById('qb-vis-nl-step').value) || 1;
        const raw = document.getElementById('qb-vis-nl-points').value;
        const points = raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        return { type: 'numberline', start: isNaN(start) ? -5 : start, end: isNaN(end) ? 5 : end, step, points };
    }
    if (t === 'shape') {
        return {
            type: 'shape',
            shapeType: document.getElementById('qb-vis-shape-type').value,
            dim1: document.getElementById('qb-vis-dim1').value || '8',
            dim2: document.getElementById('qb-vis-dim2').value || '5',
            dim3: document.getElementById('qb-vis-dim3').value || ''
        };
    }
    if (t === 'inequality') {
        return {
            type: 'inequality',
            op: document.getElementById('qb-vis-ineq-op').value,
            val1: parseFloat(document.getElementById('qb-vis-ineq-val1').value) || 0,
            val2: parseFloat(document.getElementById('qb-vis-ineq-val2').value) || 5,
            start: parseFloat(document.getElementById('qb-vis-ineq-start').value) || -2,
            end: parseFloat(document.getElementById('qb-vis-ineq-end').value) || 8
        };
    }
    if (t === 'coordinate') {
        return {
            type: 'coordinate',
            xmin: parseInt(document.getElementById('qb-vis-co-xmin').value) || -6,
            xmax: parseInt(document.getElementById('qb-vis-co-xmax').value) || 6,
            ymin: parseInt(document.getElementById('qb-vis-co-ymin').value) || -6,
            ymax: parseInt(document.getElementById('qb-vis-co-ymax').value) || 6,
            pointsRaw: document.getElementById('qb-vis-co-points').value,
            linesRaw: document.getElementById('qb-vis-co-lines').value
        };
    }
    return { type: 'none' };
}

function qbRenderVisualSVG(cfg) {
    if (!cfg || cfg.type === 'none') return '';
    if (cfg.type === 'numberline') return qbSVGNumberLine(cfg);
    if (cfg.type === 'shape') return qbSVGShape(cfg);
    if (cfg.type === 'inequality') return qbSVGInequality(cfg);
    if (cfg.type === 'coordinate') return qbSVGCoordinate(cfg);
    return '';
}

function qbSVGNumberLine(cfg) {
    const { start, end, step, points } = cfg;
    if (start >= end || step <= 0) return '<span style="color:var(--incorrect);font-size:0.8rem;">Invalid range</span>';
    const W = 460, H = 72, PAD = 32;
    const lineY = 36;
    const range = end - start;
    const toX = v => PAD + ((v - start) / range) * (W - 2 * PAD);

    let ticks = '', labels = '';
    let v = start;
    while (v <= end + 0.0001) {
        const x = toX(v);
        ticks += `<line x1="${x.toFixed(1)}" y1="${lineY - 6}" x2="${x.toFixed(1)}" y2="${lineY + 6}" stroke="#666" stroke-width="1.5"/>`;
        labels += `<text x="${x.toFixed(1)}" y="${lineY + 20}" text-anchor="middle" font-size="11" fill="#555">${v % 1 === 0 ? v : parseFloat(v.toFixed(2))}</text>`;
        v = Math.round((v + step) * 10000) / 10000;
    }
    let dots = '';
    (points || []).forEach(p => {
        if (p < start - 0.001 || p > end + 0.001) return;
        const x = toX(p);
        dots += `<circle cx="${x.toFixed(1)}" cy="${lineY}" r="6" fill="var(--primary-color)" stroke="white" stroke-width="1.5"/>`;
        dots += `<text x="${x.toFixed(1)}" y="${lineY - 11}" text-anchor="middle" font-size="11" fill="var(--primary-color)" font-weight="600">${p % 1 === 0 ? p : parseFloat(p.toFixed(2))}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;overflow:visible;">
      <defs>
        <marker id="nlArrR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#666"/></marker>
        <marker id="nlArrL" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto"><path d="M6,0 L6,6 L0,3 z" fill="#666"/></marker>
      </defs>
      <line x1="${PAD - 6}" y1="${lineY}" x2="${W - PAD + 6}" y2="${lineY}" stroke="#666" stroke-width="2" marker-end="url(#nlArrR)" marker-start="url(#nlArrL)"/>
      ${ticks}${labels}${dots}
    </svg>`;
}

function qbSVGShape(cfg) {
    const { shapeType, dim1, dim2, dim3 } = cfg;
    const W = 300, H = 210, PAD = 42;
    const lbl = (txt, fill = '#333') => `font-size="12" font-family="sans-serif" fill="${fill}" font-weight="600"`;

    if (shapeType === 'rectangle' || shapeType === 'square') {
        const rw = 190, rh = shapeType === 'square' ? 130 : 120;
        const rx = (W - rw) / 2, ry = (H - rh) / 2;
        const topLbl = shapeType === 'square' ? `side = ${dim1}` : `w = ${dim1}`;
        const sideLbl = shapeType === 'square' ? '' : `h = ${dim2}`;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2" rx="2"/>
          <text x="${W / 2}" y="${ry + rh + 18}" text-anchor="middle" ${lbl()}>${topLbl}</text>
          ${sideLbl ? `<text x="${rx - 10}" y="${H / 2 + 5}" text-anchor="middle" transform="rotate(-90,${rx - 10},${H / 2})" ${lbl()}>${sideLbl}</text>` : ''}
        </svg>`;
    }
    if (shapeType === 'circle') {
        const r = 75, cx = W / 2, cy = H / 2;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2"/>
          <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--primary-color)" stroke-width="1.5" stroke-dasharray="4,3"/>
          <text x="${cx + r / 2 + 2}" y="${cy - 8}" text-anchor="middle" ${lbl()}>r = ${dim1}</text>
          <circle cx="${cx}" cy="${cy}" r="3" fill="var(--primary-color)"/>
        </svg>`;
    }
    if (shapeType === 'right-triangle') {
        const bw = 175, bh = 120;
        const x1 = (W - bw) / 2, y2 = (H + bh) / 2, y1 = y2 - bh, x2 = x1 + bw;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <polygon points="${x1},${y2} ${x2},${y2} ${x1},${y1}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2"/>
          <rect x="${x1 + 2}" y="${y2 - 14}" width="12" height="12" fill="none" stroke="var(--primary-color)" stroke-width="1.5"/>
          <text x="${W / 2}" y="${y2 + 17}" text-anchor="middle" ${lbl()}>${dim1}</text>
          <text x="${x1 - 10}" y="${H / 2 + 5}" text-anchor="middle" transform="rotate(-90,${x1 - 10},${H / 2})" ${lbl()}>${dim2}</text>
        </svg>`;
    }
    if (shapeType === 'iso-triangle') {
        const bw = 180, bh = 130, cx = W / 2, ytop = (H - bh) / 2, ybot = ytop + bh;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <polygon points="${cx},${ytop} ${cx + bw / 2},${ybot} ${cx - bw / 2},${ybot}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2"/>
          <text x="${W / 2}" y="${ybot + 17}" text-anchor="middle" ${lbl()}>base = ${dim1}</text>
          <text x="${cx - bw / 4 - 14}" y="${(ytop + ybot) / 2 + 5}" text-anchor="end" ${lbl()}>h = ${dim2}</text>
        </svg>`;
    }
    if (shapeType === 'parallelogram') {
        const bw = 165, bh = 100, slant = 28;
        const x1 = (W - bw) / 2, y1 = (H - bh) / 2;
        const pts = `${x1 + slant},${y1} ${x1 + bw + slant},${y1} ${x1 + bw},${y1 + bh} ${x1},${y1 + bh}`;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <polygon points="${pts}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2"/>
          <text x="${W / 2}" y="${y1 + bh + 17}" text-anchor="middle" ${lbl()}>b = ${dim1}</text>
          <text x="${x1 - 8}" y="${H / 2 + 5}" text-anchor="middle" transform="rotate(-90,${x1 - 8},${H / 2})" ${lbl()}>h = ${dim2}</text>
        </svg>`;
    }
    if (shapeType === 'trapezoid') {
        const bw = 190, bh = 100;
        const twRatio = dim3 && dim1 ? (parseFloat(dim3) / parseFloat(dim1)) : 0.55;
        const tw = Math.max(40, Math.min(bw - 10, Math.round(bw * Math.min(twRatio, 0.95))));
        const x1 = (W - bw) / 2, y1 = (H - bh) / 2, x2 = (W - tw) / 2;
        const pts = `${x2},${y1} ${x2 + tw},${y1} ${x1 + bw},${y1 + bh} ${x1},${y1 + bh}`;
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
          <polygon points="${pts}" fill="var(--primary-light)" stroke="var(--primary-color)" stroke-width="2"/>
          <text x="${W / 2}" y="${y1 - 6}" text-anchor="middle" ${lbl()}>top = ${dim3 || '?'}</text>
          <text x="${W / 2}" y="${y1 + bh + 17}" text-anchor="middle" ${lbl()}>base = ${dim1}</text>
          <text x="${x1 - 8}" y="${H / 2 + 5}" text-anchor="middle" transform="rotate(-90,${x1 - 8},${H / 2})" ${lbl()}>h = ${dim2}</text>
        </svg>`;
    }
    return '';
}

function qbSVGInequality(cfg) {
    const { op, val1, val2, start, end } = cfg;
    const W = 460, H = 82, PAD = 32;
    const lineY = 44;
    const range = end - start;
    if (range <= 0) return '<span style="color:var(--incorrect);font-size:0.8rem;">Invalid range</span>';
    const toX = v => PAD + ((v - start) / range) * (W - 2 * PAD);
    const BLUE = '#3b82f6';

    let ticks = '', labels = '';
    for (let v = Math.ceil(start); v <= end; v++) {
        const x = toX(v).toFixed(1);
        ticks += `<line x1="${x}" y1="${lineY - 5}" x2="${x}" y2="${lineY + 5}" stroke="#666" stroke-width="1.5"/>`;
        labels += `<text x="${x}" y="${lineY + 19}" text-anchor="middle" font-size="11" fill="#555">${v}</text>`;
    }

    const x1 = toX(val1), x2 = toX(val2);
    const filled = (op === 'gte' || op === 'lte');
    let shade = '';
    if (op === 'gt' || op === 'gte') {
        shade = `<rect x="${x1.toFixed(1)}" y="${lineY - 5}" width="${(W - PAD - x1).toFixed(1)}" height="10" fill="${BLUE}" opacity="0.25"/>
                 <polygon points="${(W - PAD + 10).toFixed(1)},${lineY} ${(W - PAD).toFixed(1)},${lineY - 6} ${(W - PAD).toFixed(1)},${lineY + 6}" fill="${BLUE}"/>`;
    } else if (op === 'lt' || op === 'lte') {
        shade = `<rect x="${PAD}" y="${lineY - 5}" width="${(x1 - PAD).toFixed(1)}" height="10" fill="${BLUE}" opacity="0.25"/>
                 <polygon points="${(PAD - 10)},${lineY} ${PAD},${lineY - 6} ${PAD},${lineY + 6}" fill="${BLUE}"/>`;
    } else if (op === 'between') {
        shade = `<rect x="${x1.toFixed(1)}" y="${lineY - 5}" width="${(x2 - x1).toFixed(1)}" height="10" fill="${BLUE}" opacity="0.25"/>`;
    }

    const opLabelMap = { gt: `x > ${val1}`, gte: `x \u2265 ${val1}`, lt: `x < ${val1}`, lte: `x \u2264 ${val1}`, between: `${val1} \u2264 x \u2264 ${val2}` };
    const opLabel = opLabelMap[op] || '';

    let circles = `<circle cx="${x1.toFixed(1)}" cy="${lineY}" r="6" fill="${(filled || op === 'between') ? BLUE : 'white'}" stroke="${BLUE}" stroke-width="2"/>`;
    circles += `<text x="${x1.toFixed(1)}" y="${lineY - 13}" text-anchor="middle" font-size="11" fill="${BLUE}" font-weight="600">${val1}</text>`;
    if (op === 'between') {
        circles += `<circle cx="${x2.toFixed(1)}" cy="${lineY}" r="6" fill="${BLUE}" stroke="${BLUE}" stroke-width="2"/>`;
        circles += `<text x="${x2.toFixed(1)}" y="${lineY - 13}" text-anchor="middle" font-size="11" fill="${BLUE}" font-weight="600">${val2}</text>`;
    }

    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;overflow:visible;">
      <defs>
        <marker id="iqArrR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#666"/></marker>
        <marker id="iqArrL" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto"><path d="M6,0 L6,6 L0,3 z" fill="#666"/></marker>
      </defs>
      ${shade}
      <line x1="${PAD - 6}" y1="${lineY}" x2="${W - PAD + 6}" y2="${lineY}" stroke="#666" stroke-width="2" marker-end="url(#iqArrR)" marker-start="url(#iqArrL)"/>
      ${ticks}${labels}${circles}
      <text x="${W / 2}" y="${H - 2}" text-anchor="middle" font-size="12" fill="${BLUE}" font-weight="600">${opLabel}</text>
    </svg>`;
}

function qbSVGCoordinate(cfg) {
    const { xmin, xmax, ymin, ymax, pointsRaw, linesRaw } = cfg;
    if (xmin >= xmax || ymin >= ymax) return '<span style="color:var(--incorrect);font-size:0.8rem;">Invalid range</span>';
    const W = 300, H = 300, PAD = 28;
    const plotW = W - 2 * PAD, plotH = H - 2 * PAD;
    const toSX = x => PAD + ((x - xmin) / (xmax - xmin)) * plotW;
    const toSY = y => H - PAD - ((y - ymin) / (ymax - ymin)) * plotH;
    const ox = toSX(0), oy = toSY(0);

    let grid = '';
    for (let x = Math.ceil(xmin); x <= xmax; x++) {
        const sx = toSX(x).toFixed(1);
        grid += `<line x1="${sx}" y1="${PAD}" x2="${sx}" y2="${H - PAD}" stroke="#e5e5e5" stroke-width="1"/>`;
    }
    for (let y = Math.ceil(ymin); y <= ymax; y++) {
        const sy = toSY(y).toFixed(1);
        grid += `<line x1="${PAD}" y1="${sy}" x2="${W - PAD}" y2="${sy}" stroke="#e5e5e5" stroke-width="1"/>`;
    }

    let axes = `<line x1="${PAD}" y1="${oy.toFixed(1)}" x2="${W - PAD}" y2="${oy.toFixed(1)}" stroke="#555" stroke-width="2"/>
                <line x1="${ox.toFixed(1)}" y1="${PAD}" x2="${ox.toFixed(1)}" y2="${H - PAD}" stroke="#555" stroke-width="2"/>`;
    axes += `<polygon points="${W - PAD + 4},${oy.toFixed(1)} ${W - PAD - 2},${oy - 4} ${W - PAD - 2},${oy + 4}" fill="#555"/>`;
    axes += `<polygon points="${ox.toFixed(1)},${PAD - 4} ${ox - 4},${PAD + 2} ${ox + 4},${PAD + 2}" fill="#555"/>`;
    axes += `<text x="${W - PAD + 7}" y="${oy + 4}" font-size="12" fill="#555" font-weight="bold">x</text>`;
    axes += `<text x="${ox + 5}" y="${PAD - 6}" font-size="12" fill="#555" font-weight="bold">y</text>`;
    axes += `<text x="${ox - 10}" y="${oy + 14}" text-anchor="middle" font-size="10" fill="#777">0</text>`;

    let axLabels = '';
    const xSpan = xmax - xmin, ySpan = ymax - ymin;
    for (let x = Math.ceil(xmin); x <= xmax; x++) {
        if (x === 0) continue;
        const sx = toSX(x).toFixed(1);
        axLabels += `<line x1="${sx}" y1="${oy - 4}" x2="${sx}" y2="${oy + 4}" stroke="#555" stroke-width="1.5"/>`;
        if (xSpan <= 14 || x % 2 === 0)
            axLabels += `<text x="${sx}" y="${oy + 15}" text-anchor="middle" font-size="10" fill="#777">${x}</text>`;
    }
    for (let y = Math.ceil(ymin); y <= ymax; y++) {
        if (y === 0) continue;
        const sy = toSY(y).toFixed(1);
        axLabels += `<line x1="${ox - 4}" y1="${sy}" x2="${ox + 4}" y2="${sy}" stroke="#555" stroke-width="1.5"/>`;
        if (ySpan <= 14 || y % 2 === 0)
            axLabels += `<text x="${ox - 6}" y="${sy + 4}" text-anchor="end" font-size="10" fill="#777">${y}</text>`;
    }

    let linesEl = '';
    if (linesRaw) {
        linesRaw.split(',').forEach(ls => {
            const m = ls.trim().match(/y\s*=\s*(-?\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)?/i);
            if (!m) return;
            const slope = parseFloat(m[1] === '' || m[1] === '-' ? (m[1] === '-' ? '-1' : '1') : m[1]);
            const intercept = m[2] ? parseFloat(m[2].replace(/\s/g, '')) : 0;
            const sy1 = toSY(slope * xmin + intercept).toFixed(1);
            const sy2 = toSY(slope * xmax + intercept).toFixed(1);
            linesEl += `<line x1="${PAD}" y1="${sy1}" x2="${W - PAD}" y2="${sy2}" stroke="#e74c3c" stroke-width="2" clip-path="url(#cpClip)"/>`;
        });
    }

    let pts = '';
    if (pointsRaw) {
        [...pointsRaw.matchAll(/\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)\s*([A-Za-z0-9]*)/g)].forEach(([, px, py, lbl]) => {
            const sx = toSX(parseFloat(px)).toFixed(1), sy = toSY(parseFloat(py)).toFixed(1);
            pts += `<circle cx="${sx}" cy="${sy}" r="5" fill="var(--primary-color)" stroke="white" stroke-width="1.5"/>`;
            if (lbl) pts += `<text x="${+sx + 8}" y="${+sy - 5}" font-size="11" fill="var(--primary-color)" font-weight="600">${lbl}</text>`;
        });
    }

    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;">
      <defs><clipPath id="cpClip"><rect x="${PAD}" y="${PAD}" width="${plotW}" height="${plotH}"/></clipPath></defs>
      ${grid}${axes}${axLabels}${linesEl}${pts}
    </svg>`;
}

function qbShapeTypeChanged() {
    const t = document.getElementById('qb-vis-shape-type').value;
    const cfgs = {
        'rectangle': { d1: 'Width', d2: 'Height', d3: null },
        'square': { d1: 'Side', d2: null, d3: null },
        'right-triangle': { d1: 'Base', d2: 'Height', d3: null },
        'iso-triangle': { d1: 'Base', d2: 'Height', d3: null },
        'circle': { d1: 'Radius', d2: null, d3: null },
        'parallelogram': { d1: 'Base', d2: 'Height', d3: null },
        'trapezoid': { d1: 'Bottom Base', d2: 'Height', d3: 'Top Base' }
    };
    const c = cfgs[t] || { d1: 'Dim 1', d2: 'Dim 2', d3: null };
    document.getElementById('qb-vis-dim1-lbl').textContent = c.d1;
    document.getElementById('qb-vis-dim2-wrap').style.display = c.d2 ? 'flex' : 'none';
    if (c.d2) document.getElementById('qb-vis-dim2-lbl').textContent = c.d2;
    document.getElementById('qb-vis-dim3-row').style.display = c.d3 ? '' : 'none';
    if (c.d3) document.getElementById('qb-vis-dim3-lbl').textContent = c.d3;
    qbManUpdateVisualPreview();
}

function qbIneqOpChanged() {
    const op = document.getElementById('qb-vis-ineq-op').value;
    document.getElementById('qb-vis-ineq-val2-wrap').style.display = op === 'between' ? 'inline-flex' : 'none';
    qbManUpdateVisualPreview();
}

function qbRestoreVisualConfig(visual) {
    const btns = document.querySelectorAll('.qb-vis-btn');
    const typeOrder = ['none', 'numberline', 'shape', 'inequality', 'coordinate'];
    if (!visual || visual.type === 'none' || !visual.type) {
        btns.forEach((b, i) => b.classList.toggle('active', i === 0));
        ['numberline', 'shape', 'inequality', 'coordinate'].forEach(t => {
            const el = document.getElementById('qb-vis-cfg-' + t);
            if (el) el.style.display = 'none';
        });
        QBState.manVisualType = 'none';
        return;
    }
    QBState.manVisualType = visual.type;
    btns.forEach((b, i) => b.classList.toggle('active', typeOrder[i] === visual.type));
    ['numberline', 'shape', 'inequality', 'coordinate'].forEach(t => {
        const el = document.getElementById('qb-vis-cfg-' + t);
        if (el) el.style.display = (t === visual.type) ? '' : 'none';
    });
    if (visual.type === 'numberline') {
        document.getElementById('qb-vis-nl-start').value = visual.start ?? -5;
        document.getElementById('qb-vis-nl-end').value = visual.end ?? 5;
        document.getElementById('qb-vis-nl-step').value = visual.step ?? 1;
        document.getElementById('qb-vis-nl-points').value = (visual.points || []).join(', ');
    } else if (visual.type === 'shape') {
        document.getElementById('qb-vis-shape-type').value = visual.shapeType || 'rectangle';
        document.getElementById('qb-vis-dim1').value = visual.dim1 || '8';
        document.getElementById('qb-vis-dim2').value = visual.dim2 || '5';
        document.getElementById('qb-vis-dim3').value = visual.dim3 || '';
        qbShapeTypeChanged();
        return;
    } else if (visual.type === 'inequality') {
        document.getElementById('qb-vis-ineq-op').value = visual.op || 'gt';
        document.getElementById('qb-vis-ineq-val1').value = visual.val1 ?? 2;
        document.getElementById('qb-vis-ineq-val2').value = visual.val2 ?? 5;
        document.getElementById('qb-vis-ineq-start').value = visual.start ?? -2;
        document.getElementById('qb-vis-ineq-end').value = visual.end ?? 8;
        qbIneqOpChanged();
        return;
    } else if (visual.type === 'coordinate') {
        document.getElementById('qb-vis-co-xmin').value = visual.xmin ?? -6;
        document.getElementById('qb-vis-co-xmax').value = visual.xmax ?? 6;
        document.getElementById('qb-vis-co-ymin').value = visual.ymin ?? -6;
        document.getElementById('qb-vis-co-ymax').value = visual.ymax ?? 6;
        document.getElementById('qb-vis-co-points').value = visual.pointsRaw || '';
        document.getElementById('qb-vis-co-lines').value = visual.linesRaw || '';
    }
    qbManUpdateVisualPreview();
}

// ========================
// SHARED: FIREBASE SAVE
// ========================
async function qbDoSave(name, anchor, cat, grade, questions, variableDescriptor, skillClass, chapter) {
    let retries = 0;
    while (typeof fbSaveCustomSkill !== 'function' && retries++ < 20) {
        await new Promise(r => setTimeout(r, 150));
    }
    if (typeof fbSaveCustomSkill !== 'function') throw new Error('Firebase not available');

    const type = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const id = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const skillData = {
        type,
        name,
        anchor: anchor || '',
        category: cat || '',
        grade: grade || '',
        skillClass: skillClass || '',
        chapter: chapter || '',
        questions: questions.map(q => ({
            text: q.text,
            questionHTML: q.text,
            options: q.options || [],
            correct: q.correct || (q.options && q.options[0] ? q.options[0].replace(/^[A-D]\)\s*/, '') : ''),
            guide: q.guide || '',
            openEnded: q.openEnded || false,
            visual: q.visual || null,
            visualHTML: q.visualHTML || '',
            optionVisuals: q.optionVisuals || null,
            answerVisual: q.answerVisual || null,
            isCustom: true,
            variableDescriptor: q.variableDescriptor || variableDescriptor || null
        })),
        questionText: questions[0]?.text || '',
        questionHTML: questions[0]?.text || '',
        answerText: questions[0]?.correct || '',
        distractorTexts: (questions[0]?.options || []).filter(o => o.replace(/^[A-D]\)\s*/, '') !== (questions[0]?.correct || '')).map(o => o.replace(/^[A-D]\)\s*/, '')),
        guideText: questions[0]?.guide || '',
        openEnded: false,
        dynamic: !!(variableDescriptor),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    await fbSaveCustomSkill(id, skillData);
    QBState.skillsCache[id] = skillData;
}

// ========================
// PARSE TEXT
// ========================
function qbParseText(raw) {
    // Strip leading Markdown decoration (##, **, *, -, >, `, bullet chars) so
    // regexes below match regardless of the model's formatting style.
    const stripMd = (s) => s
        .replace(/^\s*[>\-\*\u2022\u2023\u25E6\u2043]\s+/, '')
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '')
        .replace(/^__\s*/, '').replace(/\s*__$/, '')
        .replace(/^`+\s*/, '').replace(/\s*`+$/, '')
        .trim();
    const lines = raw.split('\n').map(l => stripMd(l)).filter(l => l);
    const questions = [];
    let cur = null, answerSection = false, answerList = [];
    const flush = () => {
        if (cur && cur.text) {
            if (cur.openEnded || cur.options.length >= 2) {
                questions.push({ ...cur, isCustom: true });
            }
        }
        cur = null;
    };
    // Accept: "1)", "1.", "1 -", "Q1.", "Question 1:", "**1)**", etc.
    const qRe = /^(?:Q(?:uestion)?\s*)?(\d+)\s*[).:\-]\s*(.+)/i;
    // Accept "(A) text", "[A] text", or "A) / A. / A- / A: text". Requires a
    // delimiter so prose like "Apple is red" isn't mistaken for option A.
    const cRe = /^(?:\(([A-Da-d])\)|\[([A-Da-d])\]|([A-Da-d])[).:\-])\s+(.+)/;
    for (const line of lines) {
        // Strip inline bold/italic around the option letter so "**A)** text" parses
        const cleaned = line.replace(/\*\*/g, '').replace(/^__|__$/g, '').trim();
        if (/^answers?\b/i.test(cleaned)) {
            answerSection = true;
            flush();
            // Some models put the first letter on the same line: "ANSWERS: B, A, D..."
            const inline = cleaned.replace(/^answers?\s*:?/i, '').trim();
            if (inline) {
                const letters = inline.match(/\b([A-D])\b/gi);
                if (letters) answerList.push(...letters.map(l => l.toUpperCase()));
            }
            continue;
        }
        if (answerSection) {
            const letters = cleaned.match(/\b([A-D])\b/gi);
            if (letters) answerList.push(...letters.map(l => l.toUpperCase()));
            continue;
        }
        const oeMatch = cleaned.match(/^Answer\s*[:\-]\s*(.+)/i);
        if (oeMatch && cur) { cur.correct = oeMatch[1].trim(); cur.openEnded = true; continue; }
        const qMatch = cleaned.match(qRe);
        if (qMatch) { flush(); cur = { text: qMatch[2].trim(), options: [], correct: '', guide: '', openEnded: false }; continue; }
        const choiceMatch = cleaned.match(cRe);
        if (choiceMatch && cur && cur.options.length < 4) {
            const letter = (choiceMatch[1] || choiceMatch[2] || choiceMatch[3]).toUpperCase();
            cur.options.push(letter + ') ' + choiceMatch[4].trim());
            continue;
        }
        if (cur && !cur.options.length && !cur.openEnded) cur.text += ' ' + cleaned;
    }
    flush();
    let mcIdx = 0;
    questions.forEach(q => {
        if (!q.openEnded) {
            const letter = answerList[mcIdx++];
            if (letter) {
                const opt = q.options.find(o => o.startsWith(letter + ')'));
                if (opt) q.correct = opt.replace(/^[A-D]\)\s*/, '');
            }
            if (!q.correct && q.options.length) q.correct = q.options[0].replace(/^[A-D]\)\s*/, '');
        }
    });
    return questions;
}

// ========================
// RENDER Q CARDS
// ========================
function qbRenderQCards(containerId, qs, prefix) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!qs.length) { el.innerHTML = ''; return; }
    el.innerHTML = qs.map((q, i) => {
        const typeBadge = q.openEnded
            ? `<span style="font-size:0.65rem;padding:0.1rem 0.3rem;border-radius:3px;background:var(--bg-surface);border:1px solid var(--border-color);color:var(--text-secondary);margin-left:0.3rem;">Open Ended</span>`
            : '';
        const body = q.openEnded
            ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:0.25rem;">Answer: <strong style="color:var(--correct);">${escHtml(q.correct || '')}</strong>${q.answerVisual ? `<div style="margin-top:0.3rem;max-width:100%;overflow:hidden;">${q.answerVisual.visualHTML}</div>` : ''}</div>`
            : (() => {
                const hasOptVis = q.optionVisuals && Object.keys(q.optionVisuals).length > 0;
                const opts = (q.options || []).map(o => {
                    const letter = (o.match(/^([A-D])/) || [])[1];
                    const isCorrect = o.replace(/^[A-D]\)\s*/, '') === (q.correct || '').replace(/^[A-D]\)\s*/, '');
                    const optV = hasOptVis && letter && q.optionVisuals[letter];
                    if (hasOptVis) {
                        return `<div class="admin-q-opt ${isCorrect ? 'correct' : ''}" style="margin-bottom:0.3rem;">
                            <div>${escHtml(o)}</div>
                            ${optV ? `<div style="margin-top:0.25rem;max-width:100%;overflow:hidden;">${optV.visualHTML}</div>` : ''}
                        </div>`;
                    }
                    return `<div class="admin-q-opt ${isCorrect ? 'correct' : ''}">${escHtml(o)}</div>`;
                }).join('');
                return hasOptVis
                    ? `<div style="margin-top:0.4rem;">${opts}</div>`
                    : `<div class="admin-q-opts">${opts}</div>`;
            })();
        return `
        <div class="admin-q-card" id="${prefix}-qcard-${i}">
            <div class="admin-q-card-head">
                <span>Q${i + 1}${typeBadge}</span>
                <div style="display:flex;gap:0.3rem;">
                    ${prefix === 'man' ? `<button class="admin-q-del" style="color:var(--primary-color);border-color:var(--primary-color);" title="Copy this question into the form to make a variation" onclick="qbManCopy(${i})">Copy \u2191</button>` : ''}
                    <button class="admin-q-del" onclick="qbDeleteQ('${prefix}',${i})">Remove</button>
                </div>
            </div>
            <div class="admin-q-card-body">
                ${q.visualHTML ? `<div style="margin-bottom:0.4rem;max-width:100%;overflow:hidden;">${q.visualHTML}</div>` : ''}
                <div style="font-weight:600;margin-bottom:0.3rem;">${escHtml(q.text)}</div>
                ${body}
                ${q.guide ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.3rem;">Hint: ${escHtml(q.guide)}</div>` : ''}
            </div>
        </div>`;
    }).join('');
}

function qbDeleteQ(prefix, idx) {
    if (prefix === 'paste') {
        QBState.pasteQs.splice(idx, 1);
        qbRenderQCards('qb-paste-preview', QBState.pasteQs, 'paste');
        document.getElementById('qb-paste-count').textContent = QBState.pasteQs.length;
        if (!QBState.pasteQs.length) document.getElementById('qb-paste-save').style.display = 'none';
    } else if (prefix === 'ai') {
        QBState.aiQs.splice(idx, 1);
        qbRenderQCards('qb-ai-preview', QBState.aiQs, 'ai');
        document.getElementById('qb-ai-count').textContent = QBState.aiQs.length;
        if (!QBState.aiQs.length) document.getElementById('qb-ai-save').style.display = 'none';
    } else if (prefix === 'man') {
        QBState.manQs.splice(idx, 1);
        qbRenderQCards('qb-man-preview', QBState.manQs, 'man');
        if (!QBState.manQs.length) document.getElementById('qb-man-save').style.display = 'none';
    } else if (prefix === 'clone') {
        QBState.cloneQs.splice(idx, 1);
        qbRenderQCards('qb-clone-preview', QBState.cloneQs, 'clone');
        const countEl = document.getElementById('qb-clone-count');
        if (countEl) countEl.textContent = QBState.cloneQs.length;
        const saveEl = document.getElementById('qb-clone-save');
        if (!QBState.cloneQs.length && saveEl) saveEl.style.display = 'none';
    }
}

// ========================
// SAVED SKILLS LIST
// ========================
async function qbLoadSkills() {
    const list = document.getElementById('qb-skills-list');
    if (!list) return;
    list.innerHTML = '<div class="admin-empty">Loading...</div>';
    try {
        let retries = 0;
        while (typeof fbGetCustomSkills !== 'function' && retries++ < 30) {
            await new Promise(r => setTimeout(r, 200));
        }
        QBState.skillsCache = await fbGetCustomSkills() || {};
        _qbPopulateSavedFilters();
        qbRenderSkills();
    } catch (e) {
        list.innerHTML = '<div class="admin-empty">Error loading: ' + escHtml(e.message) + '</div>';
    }
}

function qbRenderSkills() {
    const list = document.getElementById('qb-skills-list');
    if (!list) return;
    const fv = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : 'all';
    };
    const grade = fv('qb-filter-grade');
    const cat = fv('qb-filter-cat');
    const cls = fv('qb-filter-class');
    const chapter = fv('qb-filter-chapter');
    const anchor = fv('qb-filter-anchor');
    const search = ((document.getElementById('qb-filter-search') || {}).value || '').toLowerCase();

    const entries = Object.entries(QBState.skillsCache).filter(([id, sk]) => {
        if (grade !== 'all' && (sk.grade || '') !== grade) return false;
        if (cat !== 'all' && (sk.category || '') !== cat) return false;
        if (cls !== 'all' && (sk.skillClass || '') !== cls) return false;
        if (chapter !== 'all' && (sk.chapter || '') !== chapter) return false;
        if (anchor !== 'all' && (sk.anchor || '') !== anchor) return false;
        if (search) {
            const haystack = [sk.name, sk.type, sk.anchor, sk.category, sk.grade, sk.skillClass, sk.chapter, sk.questionText]
                .map(x => String(x || '')).join(' ').toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });

    if (!entries.length) {
        list.innerHTML = '<div class="admin-empty">No templates found. Create one above.</div>';
        return;
    }

    entries.sort((a, b) => (b[1].createdAt || '') > (a[1].createdAt || '') ? 1 : -1);

    list.innerHTML = entries.map(([id, sk]) => {
        const displayName = sk.name || sk.type || id;
        const qs = sk.questions || [];
        const qCount = qs.length || 1;
        const gradeLabel = sk.grade === 'algebra1' ? 'Alg' : (sk.grade ? 'Gr ' + sk.grade : '');
        const isDynamic = sk.dynamic || qs.some(q => q.variableDescriptor);
        return `
            <div class="admin-skill-card" id="qb-sk-${id}">
                <div class="admin-skill-head" onclick="qbToggleSkill('${id}')">
                    <div>
                        <div class="admin-skill-name">${escHtml(displayName)}</div>
                        <div class="admin-skill-meta">
                            ${gradeLabel ? `<span class="admin-badge grade">${gradeLabel}</span>` : ''}
                            <span class="admin-badge cat">${escHtml(sk.category || 'custom')}</span>
                            ${sk.skillClass ? `<span class="admin-badge">${escHtml(sk.skillClass)}</span>` : ''}
                            ${sk.chapter ? `<span class="admin-badge">Ch ${escHtml(sk.chapter)}</span>` : ''}
                            ${sk.anchor ? `<span class="admin-badge">${escHtml(sk.anchor)}</span>` : ''}
                            ${isDynamic ? '<span class="admin-badge dynamic">Dynamic</span>' : '<span class="admin-badge static">Static</span>'}
                            ${qCount} question${qCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="admin-skill-actions" onclick="event.stopPropagation()">
                        <button class="admin-btn admin-btn-sm" onclick="qbEditSkill('${id}')">Edit</button>
                        <button class="admin-btn admin-btn-sm" onclick="qbCloneSkill('${id}')">Clone</button>
                        <button class="admin-btn admin-btn-sm del" onclick="qbDeleteSkill('${id}', '${escHtml(displayName).replace(/'/g, "\\'")}')">Delete</button>
                    </div>
                </div>
                <div class="admin-skill-body" id="qb-sk-body-${id}">
                    ${qs.slice(0, 3).map((q, i) => `
                        <div style="margin-bottom:${i < Math.min(qs.length, 3) - 1 ? '0.5rem' : '0'};padding-bottom:${i < Math.min(qs.length, 3) - 1 ? '0.5rem' : '0'};border-bottom:${i < Math.min(qs.length, 3) - 1 ? '1px solid var(--border-color-light)' : 'none'};">
                            <strong>Q${i + 1}:</strong> ${escHtml(q.text || '')}
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.2rem;margin-top:0.25rem;">
                                ${(q.options || []).map(o => `<span style="font-size:0.78rem;padding:0.2rem 0.4rem;border:1px solid var(--border-color-light);border-radius:3px;${o.replace(/^[A-D]\)\s*/, '') === q.correct ? 'border-color:var(--correct);background:var(--correct-bg);font-weight:600;' : ''}">${escHtml(o)}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                    ${qs.length > 3 ? `<div style="color:var(--text-secondary);font-size:0.78rem;margin-top:0.4rem;">...and ${qs.length - 3} more question${qs.length - 3 !== 1 ? 's' : ''}</div>` : ''}
                    ${!qs.length && sk.questionText ? `<div><strong>Q1:</strong> ${escHtml(sk.questionText)}</div>` : ''}
                    <div id="qb-sk-edit-${id}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function qbToggleSkill(id) {
    const body = document.getElementById('qb-sk-body-' + id);
    if (body) body.classList.toggle('open');
}

async function qbDeleteSkill(id, name) {
    if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
    try {
        let retries = 0;
        while (typeof fbDeleteCustomSkill !== 'function' && retries++ < 20) {
            await new Promise(r => setTimeout(r, 150));
        }
        await fbDeleteCustomSkill(id);
        delete QBState.skillsCache[id];
        qbRenderSkills();
    } catch (e) {
        alert('Delete failed: ' + e.message);
    }
}

/**
 * Deep-clone an existing skill into a new record with its own id. Variable
 * descriptors, visual aids, options, and all per-question metadata are
 * preserved. The clone opens inline-edit so the user can tweak before
 * accepting; cancelling the edit leaves the clone on disk as-is.
 */
async function qbCloneSkill(id) {
    const sk = QBState.skillsCache[id];
    if (!sk) return;
    const baseName = (sk.name || sk.type || 'Question').replace(/\s+\(Copy(?:\s*\d+)?\)\s*$/, '');
    const suggested = baseName + ' (Copy)';
    const name = prompt('Name for the cloned question bank:', suggested);
    if (name == null) return;
    const finalName = name.trim() || suggested;

    let retries = 0;
    while (typeof fbSaveCustomSkill !== 'function' && retries++ < 20) {
        await new Promise(r => setTimeout(r, 150));
    }
    if (typeof fbSaveCustomSkill !== 'function') { alert('Firebase not ready.'); return; }

    const now = new Date().toISOString();
    const newId = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const cloned = JSON.parse(JSON.stringify(sk));
    cloned.name = finalName;
    cloned.type = finalName.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') || sk.type;
    cloned.createdAt = now;
    cloned.updatedAt = now;
    delete cloned.id;

    try {
        await fbSaveCustomSkill(newId, cloned);
        QBState.skillsCache[newId] = cloned;
        qbRenderSkills();
        // Open the clone immediately so the user can tweak it
        const body = document.getElementById('qb-sk-body-' + newId);
        if (body) body.classList.add('open');
        qbEditSkill(newId);
    } catch (e) {
        alert('Clone failed: ' + e.message);
    }
}

// ========================
// INLINE EDITING
// ========================
function qbEditSkill(id) {
    const sk = QBState.skillsCache[id];
    if (!sk) return;

    // Close any other open edit
    if (QBState.editingSkillId && QBState.editingSkillId !== id) {
        qbCloseEdit();
    }
    QBState.editingSkillId = id;

    // Make sure the skill body is open
    const body = document.getElementById('qb-sk-body-' + id);
    if (body && !body.classList.contains('open')) body.classList.add('open');

    const editContainer = document.getElementById('qb-sk-edit-' + id);
    if (!editContainer) return;

    const qs = sk.questions || (sk.questionText ? [{ text: sk.questionText, options: [], correct: sk.answerText || '', guide: sk.guideText || '' }] : []);
    // no longer needed — using combo-box inputs below

    let questionsHtml = qs.map((q, i) => {
        const isOE = q.openEnded;
        const optionsHtml = isOE ? '' : ['A', 'B', 'C', 'D'].map((letter, j) => {
            const optText = (q.options && q.options[j]) ? q.options[j].replace(/^[A-D]\)\s*/, '') : '';
            const isCorrect = q.options && q.options[j] && q.options[j].replace(/^[A-D]\)\s*/, '') === (q.correct || '').replace(/^[A-D]\)\s*/, '');
            return `<div class="admin-opt-row">
                <input type="radio" name="qb-edit-correct-${i}" value="${j}" ${isCorrect ? 'checked' : ''}>
                <span class="admin-opt-lbl">${letter}</span>
                <input type="text" class="admin-input" id="qb-edit-q${i}-opt${j}" value="${escHtml(optText)}" placeholder="Option ${letter}">
            </div>`;
        }).join('');

        return `<div class="admin-q-card" style="margin-bottom:0.5rem;" id="qb-edit-qcard-${i}">
            <div class="admin-q-card-head">
                <span>Q${i + 1} ${isOE ? '<small>(Open Ended)</small>' : '<small>(MC)</small>'}</span>
                <button class="admin-q-del" onclick="qbEditRemoveQ(${i})">Remove</button>
            </div>
            <div class="admin-q-card-body">
                <span class="admin-label">Question</span>
                <textarea class="admin-textarea" rows="2" id="qb-edit-q${i}-text">${escHtml(q.text || '')}</textarea>
                ${isOE ? `
                    <span class="admin-label">Answer</span>
                    <input type="text" class="admin-input" id="qb-edit-q${i}-answer" value="${escHtml(q.correct || '')}">
                ` : `
                    <span class="admin-label">Options (select correct)</span>
                    <div class="admin-opts-grid">${optionsHtml}</div>
                `}
                <span class="admin-label">Guide</span>
                <input type="text" class="admin-input" id="qb-edit-q${i}-guide" value="${escHtml(q.guide || '')}">
                <div id="qb-edit-q${i}-ve" style="margin-top:0.4rem;"></div>
            </div>
        </div>`;
    }).join('');

    editContainer.innerHTML = `
        <hr style="border:none;border-top:1px solid var(--border-color-light);margin:0.75rem 0;">
        <div style="font-size:0.8rem;font-weight:700;color:var(--primary-color);text-transform:uppercase;margin-bottom:0.5rem;">Edit Template</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            <div><span class="admin-label">Skill Name</span><input type="text" class="admin-input" id="qb-edit-name" value="${escHtml(sk.name || sk.type || '')}"></div>
            <div><span class="admin-label">Standard</span><input type="text" class="admin-input" id="qb-edit-anchor" list="qb-anchor-list" value="${escHtml(sk.anchor || '')}"></div>
            <div><span class="admin-label">Category</span><input type="text" class="admin-input" id="qb-edit-cat" list="qb-cat-list" value="${escHtml(sk.category || '')}"></div>
            <div><span class="admin-label">Grade</span><input type="text" class="admin-input" id="qb-edit-grade" list="qb-grade-list" value="${escHtml(sk.grade || '')}"></div>
            <div><span class="admin-label">Class</span><input type="text" class="admin-input" id="qb-edit-class" list="qb-class-list" value="${escHtml(sk.skillClass || '')}"></div>
            <div><span class="admin-label">Chapter</span><input type="text" class="admin-input" id="qb-edit-chapter" list="qb-chapter-list" value="${escHtml(sk.chapter || '')}"></div>
        </div>
        <div style="margin-top:0.5rem;">${questionsHtml}</div>
        <button class="btn" style="font-size:0.78rem;padding:0.3rem 0.6rem;margin-top:0.3rem;" onclick="qbEditAddQ()">+ Add Question</button>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">
            <button class="btn" onclick="qbSaveEdit()">Save Changes</button>
            <button class="admin-btn" onclick="qbSaveEdit(true)">Save as Copy</button>
            <button class="admin-btn" onclick="qbCloseEdit()">Cancel</button>
        </div>
        <span id="qb-edit-status" class="admin-status"></span>
    `;

    // Initialize variable editors for each question and cache them so qbSaveEdit
    // can pull the live templates + descriptor (the outer text inputs don't
    // reflect edits made inside the variable editor).
    QBState.editVarEditors = {};
    qs.forEach((q, i) => {
        const veEl = document.getElementById(`qb-edit-q${i}-ve`);
        if (veEl && typeof VariableEditor === 'function') {
            const ve = new VariableEditor(veEl, { questionOnly: false });
            const correctAnswer = q.openEnded ? q.correct : (q.correct || '');
            const options = (q.options || []).map(o => o.replace(/^[A-D]\)\s*/, ''));
            ve.loadQuestion(q.text || '', correctAnswer, options, q.guide || '');
            if (q.variableDescriptor) {
                try { ve.setFromDescriptor(q.variableDescriptor); } catch (e) { /* ignore */ }
            }
            QBState.editVarEditors[i] = ve;
        }
    });
}

function qbEditRemoveQ(idx) {
    const card = document.getElementById('qb-edit-qcard-' + idx);
    if (card) card.remove();
}

function qbEditAddQ() {
    const id = QBState.editingSkillId;
    if (!id) return;
    const editContainer = document.getElementById('qb-sk-edit-' + id);
    if (!editContainer) return;
    // Count existing question cards
    const existingCards = editContainer.querySelectorAll('[id^="qb-edit-qcard-"]');
    const newIdx = existingCards.length > 0 ? parseInt([...existingCards].pop().id.split('-').pop()) + 1 : 0;

    const newCard = document.createElement('div');
    newCard.className = 'admin-q-card';
    newCard.style.marginBottom = '0.5rem';
    newCard.id = 'qb-edit-qcard-' + newIdx;
    newCard.innerHTML = `
        <div class="admin-q-card-head">
            <span>Q${newIdx + 1} <small>(MC)</small></span>
            <button class="admin-q-del" onclick="qbEditRemoveQ(${newIdx})">Remove</button>
        </div>
        <div class="admin-q-card-body">
            <span class="admin-label">Question</span>
            <textarea class="admin-textarea" rows="2" id="qb-edit-q${newIdx}-text"></textarea>
            <span class="admin-label">Options (select correct)</span>
            <div class="admin-opts-grid">
                ${['A', 'B', 'C', 'D'].map((letter, j) => `<div class="admin-opt-row">
                    <input type="radio" name="qb-edit-correct-${newIdx}" value="${j}" ${j === 0 ? 'checked' : ''}>
                    <span class="admin-opt-lbl">${letter}</span>
                    <input type="text" class="admin-input" id="qb-edit-q${newIdx}-opt${j}" placeholder="Option ${letter}">
                </div>`).join('')}
            </div>
            <span class="admin-label">Guide</span>
            <input type="text" class="admin-input" id="qb-edit-q${newIdx}-guide">
            <div id="qb-edit-q${newIdx}-ve" style="margin-top:0.4rem;"></div>
        </div>
    `;
    // Insert before the Add Question button
    const addBtn = editContainer.querySelector('button[onclick="qbEditAddQ()"]');
    if (addBtn) addBtn.parentNode.insertBefore(newCard, addBtn);
    else editContainer.appendChild(newCard);
}

async function qbSaveEdit(saveAsCopy) {
    const id = QBState.editingSkillId;
    if (!id) return;
    const st = document.getElementById('qb-edit-status');
    let name = document.getElementById('qb-edit-name')?.value.trim();
    if (!name) { if (st) { st.textContent = 'Name is required.'; st.className = 'admin-status err'; } return; }

    // "Save as Copy" prompts for a new name (default: current + " (Copy)")
    // and saves to a fresh id, leaving the original untouched.
    let targetId = id;
    if (saveAsCopy) {
        const base = name.replace(/\s+\(Copy(?:\s*\d+)?\)\s*$/, '');
        const suggested = base + ' (Copy)';
        const entered = prompt('Save this as a new question bank named:', suggested);
        if (entered == null) return;
        name = entered.trim() || suggested;
        targetId = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    // Collect questions from inline form
    const editContainer = document.getElementById('qb-sk-edit-' + id);
    if (!editContainer) return;
    const qCards = editContainer.querySelectorAll('[id^="qb-edit-qcard-"]');
    const questions = [];
    qCards.forEach(card => {
        const idx = card.id.split('-').pop();
        const ve = QBState.editVarEditors && QBState.editVarEditors[idx];

        // For dynamic questions prefer the variable editor's live state — the
        // outer form inputs don't reflect edits made inside the editor.
        let text, guide, answerEl, optionsFromVE = null, correctFromVE = null, descriptor = null;
        if (ve) {
            text = (ve.questionTemplate || '').trim();
            guide = (ve.guideTemplate || '').trim();
            descriptor = ve.getDescriptor();
            if (ve.questionType === 'oe') {
                answerEl = { value: ve.answerTemplate || '' };
            } else {
                optionsFromVE = (ve.distractorTemplates || []).map(s => String(s || '').trim()).filter(Boolean);
                correctFromVE = ve.answerTemplate || '';
            }
        } else {
            const textEl = document.getElementById('qb-edit-q' + idx + '-text');
            text = textEl ? textEl.value.trim() : '';
            const guideEl = document.getElementById('qb-edit-q' + idx + '-guide');
            guide = guideEl ? guideEl.value.trim() : '';
            answerEl = document.getElementById('qb-edit-q' + idx + '-answer');
        }
        if (!text) return;

        if (answerEl && !optionsFromVE) {
            // Open ended
            questions.push({
                text,
                options: [],
                correct: (answerEl.value || '').trim(),
                guide,
                openEnded: true,
                isCustom: true,
                visual: null, visualHTML: '', optionVisuals: null, answerVisual: null,
                variableDescriptor: descriptor
            });
        } else {
            // MC
            const letters = ['A', 'B', 'C', 'D'];
            let options, correct;
            if (optionsFromVE) {
                options = optionsFromVE.slice(0, 4).map((o, j) => letters[j] + ') ' + o);
                correct = String(correctFromVE || '').trim();
            } else {
                options = [];
                letters.forEach((l, j) => {
                    const optEl = document.getElementById('qb-edit-q' + idx + '-opt' + j);
                    if (optEl && optEl.value.trim()) options.push(l + ') ' + optEl.value.trim());
                });
                const correctRadio = document.querySelector(`input[name="qb-edit-correct-${idx}"]:checked`);
                const correctIdx = correctRadio ? parseInt(correctRadio.value) : 0;
                const correctOpt = options[correctIdx] || options[0] || '';
                correct = correctOpt.replace(/^[A-D]\)\s*/, '');
            }
            questions.push({
                text, options, correct, guide,
                openEnded: false,
                isCustom: true,
                visual: null, visualHTML: '', optionVisuals: null, answerVisual: null,
                variableDescriptor: descriptor
            });
        }
    });

    if (!questions.length) { if (st) { st.textContent = 'Add at least one question.'; st.className = 'admin-status err'; } return; }

    if (st) { st.innerHTML = '<span class="admin-loading"></span> Saving...'; st.className = 'admin-status'; }
    try {
        const existing = QBState.skillsCache[id] || {};
        const nowStr = new Date().toISOString();
        const updated = {
            ...existing,
            name,
            anchor: document.getElementById('qb-edit-anchor')?.value.trim() || '',
            category: document.getElementById('qb-edit-cat')?.value.trim() || '',
            grade: document.getElementById('qb-edit-grade')?.value.trim() || '',
            skillClass: document.getElementById('qb-edit-class')?.value.trim() || '',
            chapter: document.getElementById('qb-edit-chapter')?.value.trim() || '',
            questions,
            questionText: questions[0]?.text || '',
            questionHTML: questions[0]?.text || '',
            answerText: questions[0]?.correct || '',
            distractorTexts: (questions[0]?.options || []).filter(o => o.replace(/^[A-D]\)\s*/, '') !== (questions[0]?.correct || '')).map(o => o.replace(/^[A-D]\)\s*/, '')),
            guideText: questions[0]?.guide || '',
            updatedAt: nowStr
        };
        if (saveAsCopy) {
            updated.createdAt = nowStr;
            updated.type = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') || existing.type || 'Copy';
        }
        let retries = 0;
        while (typeof fbSaveCustomSkill !== 'function' && retries++ < 20) {
            await new Promise(r => setTimeout(r, 150));
        }
        await fbSaveCustomSkill(targetId, updated);
        QBState.skillsCache[targetId] = updated;
        if (st) { st.textContent = saveAsCopy ? 'Saved as copy!' : 'Saved!'; st.className = 'admin-status ok'; }
        QBState.editingSkillId = null;
        QBState.editVarEditors = {};
        qbRenderSkills();
        if (saveAsCopy) {
            // Open the new copy so user can verify / keep editing
            const body = document.getElementById('qb-sk-body-' + targetId);
            if (body) body.classList.add('open');
            qbEditSkill(targetId);
        }
    } catch (e) {
        if (st) { st.textContent = 'Error: ' + e.message; st.className = 'admin-status err'; }
    }
}

function qbCloseEdit() {
    const id = QBState.editingSkillId;
    if (id) {
        const editContainer = document.getElementById('qb-sk-edit-' + id);
        if (editContainer) editContainer.innerHTML = '';
    }
    QBState.editingSkillId = null;
    QBState.editVarEditors = {};
}

// ========================
// VARIABLE EDITOR INTEGRATION
// ========================
function qbInitVariableEditor(tabName, questions) {
    const containerId = 'qb-' + tabName + '-ve';
    const container = document.getElementById(containerId);
    if (!container || typeof VariableEditor !== 'function' || !questions.length) return;

    container.innerHTML = '';
    const header = document.createElement('div');
    header.style.cssText = 'font-size:0.8rem;font-weight:700;color:var(--primary-color);text-transform:uppercase;margin-bottom:0.3rem;';
    header.textContent = 'Variable Editor (optional)';
    container.appendChild(header);

    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin:0 0 0.4rem;';
    hint.textContent = 'Create dynamic questions using {{variableName}} syntax. Variables can be values (numbers) or operators (+, -, \u00d7, \u00f7). Click Auto-detect to convert numbers automatically.';
    container.appendChild(hint);

    const veDiv = document.createElement('div');
    container.appendChild(veDiv);

    const q = questions[0];
    const ve = new VariableEditor(veDiv, { questionOnly: false });
    const correctAnswer = q.openEnded ? (q.correct || '') : (q.correct || '').replace(/^[A-D]\)\s*/, '');
    const options = (q.options || []).map(o => o.replace(/^[A-D]\)\s*/, ''));
    ve.loadQuestion(q.text || '', correctAnswer, options, q.guide || '');

    QBState.variableEditors[tabName] = ve;
}

function _getVariableDescriptor(tabName) {
    const ve = QBState.variableEditors[tabName];
    if (!ve || !ve.varOrder || !ve.varOrder.length) return null;
    try { return ve.getDescriptor(); } catch (e) { return null; }
}

// ========================
// INIT
// ========================
function _qbPopulateSavedFilters() {
    const grades = new Set(['3','4','5','6','7','8','algebra1']);
    const cats = new Set(['pssa','keystone','custom']);
    const classes = new Set();
    const chapters = new Set();
    const anchors = new Set();
    Object.values(QBState.skillsCache || {}).forEach(sk => {
        if (sk.grade) grades.add(sk.grade);
        if (sk.category) cats.add(sk.category);
        if (sk.skillClass) classes.add(sk.skillClass);
        if (sk.chapter) chapters.add(sk.chapter);
        if (sk.anchor) anchors.add(sk.anchor);
    });

    const gradeLabel = g => g === 'algebra1' ? 'Keystone Algebra' : (/^\d+$/.test(g) ? 'Grade ' + g : g);
    const numericSort = (a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        if (!isNaN(na)) return -1;
        if (!isNaN(nb)) return 1;
        return String(a).localeCompare(String(b));
    };

    function fillSelect(id, allLabel, values, labelFn) {
        const sel = document.getElementById(id);
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = `<option value="all">${allLabel}</option>` +
            Array.from(values).sort(numericSort)
                .map(v => `<option value="${escHtml(v)}">${escHtml(labelFn ? labelFn(v) : v)}</option>`)
                .join('');
        sel.value = cur || 'all';
    }

    fillSelect('qb-filter-grade', 'All Grades', grades, gradeLabel);
    fillSelect('qb-filter-cat', 'All Categories', cats, c => c.charAt(0).toUpperCase() + c.slice(1));
    fillSelect('qb-filter-class', 'All Classes', classes);
    fillSelect('qb-filter-chapter', 'All Chapters', chapters, c => /^\d/.test(c) ? 'Ch ' + c : c);
    fillSelect('qb-filter-anchor', 'All Standards', anchors);
}

async function _qbPopulateMetadataLists() {
    const categories = new Set(['PSSA', 'Keystone', 'Custom']);
    const grades = new Set(['3', '4', '5', '6', '7', '8', 'algebra1']);
    const classes = new Set();
    const chapters = new Set();
    const anchors = new Set();

    // Pull existing values from saved skills
    try {
        Object.values(QBState.skillsCache || {}).forEach(sk => {
            if (sk.category) categories.add(sk.category);
            if (sk.grade) grades.add(sk.grade);
            if (sk.skillClass) classes.add(sk.skillClass);
            if (sk.chapter) chapters.add(sk.chapter);
            if (sk.anchor) anchors.add(sk.anchor);
        });
    } catch(e) { /* ignore */ }

    // Pull class IDs from class data
    if (typeof fbGetClassData === 'function') {
        try { Object.keys(await fbGetClassData()).forEach(k => classes.add(k)); } catch(e) { /* ignore */ }
    }

    function fill(id, values) {
        const dl = document.getElementById(id);
        if (!dl) return;
        dl.innerHTML = Array.from(values).sort().map(v => '<option value="' + escHtml(v) + '">').join('');
    }
    fill('qb-cat-list', categories);
    fill('qb-grade-list', grades);
    fill('qb-class-list', classes);
    fill('qb-chapter-list', chapters);
    fill('qb-anchor-list', anchors);
}

function _qbInit() {
    // Initialize the variable editor in the manual tab
    qbManInitEditor();

    // Load skills after Firebase is ready
    const tryLoad = setInterval(() => {
        if (typeof fbGetCustomSkills === 'function') {
            clearInterval(tryLoad);
            qbLoadSkills().then(() => _qbPopulateMetadataLists());
        }
    }, 200);
    setTimeout(() => clearInterval(tryLoad), 10000);
}

window.addEventListener('load', _qbInit);
