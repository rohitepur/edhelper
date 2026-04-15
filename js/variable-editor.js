/**
 * Variable Editor Component (v2)
 * Template-based editor where users mark variables with {{name}} syntax.
 * Variables can be VALUES (numbers with min/max) or OPERATORS (+, -, x, ÷).
 * Produces a variableDescriptor for Firebase storage, rehydrated by dynamic-gen.js.
 */

class VariableEditor {
  constructor(containerEl, options) {
    options = options || {};
    this.container = containerEl;
    this.onChange = options.onChange || function () {};
    this.questionOnly = !!options.questionOnly;

    // Template strings with {{var}} placeholders
    this.questionTemplate = '';
    this.answerTemplate = '';
    this.distractorTemplates = [];
    this.guideTemplate = '';

    // Variable definitions keyed by name
    this.variables = {};
    // Ordered list of variable names (in order of first appearance)
    this.varOrder = [];

    // Question type: 'mc' or 'oe'
    this.questionType = 'mc';
    // Custom distractor expressions (empty = auto-generate)
    this.distractorExprs = [];

    this.render();
  }

  // ---- Public API -----------------------------------------------------------

  /** Load a question for editing. Converts raw text to template if no {{}} found. */
  loadQuestion(text, correctAnswer, options, guide) {
    this.questionTemplate = text || '';
    this.answerTemplate = correctAnswer || '';
    this.distractorTemplates = Array.isArray(options) ? options.slice() : [];
    this.guideTemplate = guide || '';
    this.variables = {};
    this.varOrder = [];

    // If the text already has {{var}} syntax, parse them out
    this._detectVarsFromTemplates();
    this.render();
    this.onChange();
  }

  /** Get the descriptor for storage/generation */
  getDescriptor() {
    var slots = [];
    var nameToIndex = {};
    var self = this;

    this.varOrder.forEach(function (name, i) {
      nameToIndex[name] = i;
      var v = self.variables[name];
      var slot = {
        index: i,
        name: name,
        kind: v.kind || 'value',
        type: v.type || 'integer',
        original: v.original || '',
        placeholder: '{' + i + '}',
        min: v.min != null ? v.min : 1,
        max: v.max != null ? v.max : 100
      };
      if (v.step != null) slot.step = v.step;
      if (v.choices && v.choices.length) slot.choices = v.choices;
      if (v.expression) slot.expression = v.expression;
      if (v.label) slot.label = v.label;
      if (v.kind === 'operator') {
        slot.operators = v.operators || ['+', '-', '*', '/'];
      }
      slots.push(slot);
    });

    // Convert {{name}} to {index} for templates
    function toIndexTemplate(tmpl) {
      if (!tmpl) return tmpl;
      return tmpl.replace(/\{\{(\w+)\}\}/g, function (m, name) {
        return nameToIndex[name] != null ? '{' + nameToIndex[name] + '}' : m;
      });
    }

    return {
      textTemplate: toIndexTemplate(this.questionTemplate),
      answerTemplate: toIndexTemplate(this.answerTemplate),
      distractorTemplates: this.distractorTemplates.map(toIndexTemplate),
      distractorExprs: this.distractorExprs.filter(function(e) { return e.trim(); }),
      guideTemplate: toIndexTemplate(this.guideTemplate),
      questionType: this.questionType,
      slots: slots,
      operation: { type: 'user-defined' }
    };
  }

  /** Load from a saved descriptor (for editing existing dynamic questions) */
  setFromDescriptor(descriptor) {
    this.variables = {};
    this.varOrder = [];
    var srcSlots = descriptor.slots || descriptor.tokens || [];
    var self = this;

    // Build variables from slots
    srcSlots.forEach(function (src, i) {
      var name;
      if (typeof src === 'string') {
        name = self._nextVarName(i, self.variables);
        self.variables[name] = self._inferVarFromToken(src);
        self.variables[name].name = name;
      } else {
        name = src.name || self._nextVarName(i, self.variables);
        self.variables[name] = {
          name: name,
          kind: src.kind || (src.operators ? 'operator' : 'value'),
          type: src.type || 'integer',
          original: String(src.original != null ? src.original : ''),
          min: src.min != null ? src.min : 0,
          max: src.max != null ? src.max : 100,
          step: src.step || 1,
          choices: src.choices || [],
          expression: src.expression || '',
          label: src.label || '',
          operators: src.operators || ['+', '-', '*', '/']
        };
      }
      self.varOrder.push(name);
    });

    // Convert {index} templates to {{name}} templates
    function toNameTemplate(tmpl) {
      if (!tmpl) return '';
      return tmpl.replace(/\{(\d+)\}/g, function (m, idx) {
        var name = self.varOrder[parseInt(idx)];
        return name ? '{{' + name + '}}' : m;
      });
    }

    this.questionTemplate = toNameTemplate(descriptor.textTemplate || '');
    this.answerTemplate = toNameTemplate(descriptor.answerTemplate || '');
    if (descriptor.distractorTemplates) {
      this.distractorTemplates = descriptor.distractorTemplates.map(toNameTemplate);
    } else if (descriptor.optionTemplates) {
      this.distractorTemplates = descriptor.optionTemplates.map(toNameTemplate);
    }
    this.guideTemplate = toNameTemplate(descriptor.guideTemplate || '');
    this.questionType = descriptor.questionType || 'mc';
    this.distractorExprs = descriptor.distractorExprs || [];

    this.render();
    this.onChange();
  }

  /** Generate a preview instance */
  preview() {
    var desc = this.getDescriptor();
    return generateFromDescriptor(desc);
  }

  // ---- Rendering ------------------------------------------------------------

  render() {
    this._rendering = true;
    var c = this.container;
    c.innerHTML = '';
    c.className = 've-container';

    // Math symbols toolbar
    c.appendChild(this._buildMathToolbar());

    // Section: Template inputs
    var tplSection = _el('div', 've-template-section');
    tplSection.appendChild(this._buildTemplateField('Question Template', 'questionTemplate', this.questionTemplate, 'e.g. What is {{a}} + {{b}}?'));
    if (!this.questionOnly) {
      // Question type toggle (MC / Open Ended)
      tplSection.appendChild(this._buildTypeToggle());

      // Answer expression field
      tplSection.appendChild(this._buildAnswerField());

      // Distractors config (only for MC)
      if (this.questionType === 'mc') {
        tplSection.appendChild(this._buildDistractorConfig());
      }
    }
    c.appendChild(tplSection);

    // Template preview (rendered with highlights)
    var previewBox = _el('div', 've-template-preview');
    previewBox.innerHTML = this._renderHighlightedTemplate(this.questionTemplate);
    c.appendChild(previewBox);

    // Toolbar
    var toolbar = _el('div', 've-toolbar');
    var self = this;
    toolbar.appendChild(_btn('+ Add Variable', function () { self._addNewVariable(); }));
    toolbar.appendChild(_btn('Clear All', function () {
      self.variables = {};
      self.varOrder = [];
      self.render();
      self.onChange();
    }));
    c.appendChild(toolbar);

    // Variable cards (hide internal _ans variable)
    var visibleVars = this.varOrder.filter(function (n) { return n !== '_ans'; });
    if (visibleVars.length) {
      var varsSection = _el('div', 've-vars-section');
      var varsTitle = _el('div', 've-vars-title');
      varsTitle.textContent = 'Variables (' + visibleVars.length + ')';
      varsSection.appendChild(varsTitle);

      visibleVars.forEach(function (name) {
        varsSection.appendChild(self._buildVarCard(name));
      });
      c.appendChild(varsSection);
    }

    // Live preview
    var liveSection = _el('div', 've-live-section');
    var liveTitle = _el('div', 've-live-title');
    liveTitle.textContent = 'Live Preview';
    liveSection.appendChild(liveTitle);
    var liveContent = _el('div', 've-live-content');
    liveContent.id = 've-live-' + (this.container.id || 'default');
    liveSection.appendChild(liveContent);
    var genBtn = _btn('Generate Sample', function () { self._generatePreview(); });
    genBtn.className = 've-generate-btn';
    liveSection.appendChild(genBtn);
    c.appendChild(liveSection);

    // Auto-generate a preview if we have variables
    if (this.varOrder.length) {
      setTimeout(function () { self._generatePreview(); }, 50);
    }
    this._rendering = false;
  }

  _buildMathToolbar() {
    var bar = _el('div', 've-math-bar');
    var self = this;

    // Track which input is focused so we insert into the right one
    this._lastFocusedInput = null;

    var symbols = [
      // Arithmetic display symbols (for question text)
      { label: '\u00d7', insert: '\u00d7', title: 'Multiply' },
      { label: '\u00f7', insert: '\u00f7', title: 'Divide' },
      { label: '\u00b2', insert: '\u00b2', title: 'Squared' },
      { label: '\u00b3', insert: '\u00b3', title: 'Cubed' },
      { label: '\u221a', insert: '\u221a', title: 'Square root' },
      { label: '\u03c0', insert: '\u03c0', title: 'Pi' },
      { label: '\u00b0', insert: '\u00b0', title: 'Degrees' },
      { label: '\u2264', insert: '\u2264', title: 'Less or equal' },
      { label: '\u2265', insert: '\u2265', title: 'Greater or equal' },
      { label: '\u2260', insert: '\u2260', title: 'Not equal' },
      { label: '$', insert: '$', title: 'Dollar' },
      { label: '%', insert: '%', title: 'Percent' },
      { label: '|sep|' },
      // Expression functions (for answer expression)
      { label: 'sin', insert: 'Math.sin(', title: 'Sine (radians)' },
      { label: 'cos', insert: 'Math.cos(', title: 'Cosine (radians)' },
      { label: 'tan', insert: 'Math.tan(', title: 'Tangent (radians)' },
      { label: 'abs', insert: 'Math.abs(', title: 'Absolute value' },
      { label: '\u221a', insert: 'Math.sqrt(', title: 'Square root (expression)' },
      { label: 'x\u207f', insert: 'Math.pow(', title: 'Power: Math.pow(base, exp)' },
      { label: 'round', insert: 'Math.round(', title: 'Round to nearest integer' },
      { label: 'floor', insert: 'Math.floor(', title: 'Round down' },
      { label: 'ceil', insert: 'Math.ceil(', title: 'Round up' },
      { label: '\u03c0', insert: 'Math.PI', title: 'Pi (3.14159...)' },
      { label: '( )', insert: '()', title: 'Parentheses' }
    ];

    symbols.forEach(function (sym) {
      if (sym.label === '|sep|') {
        var sep = _el('span', 've-math-sep');
        bar.appendChild(sep);
        return;
      }
      var b = _el('button', 've-math-btn');
      b.textContent = sym.label;
      b.title = sym.title || '';
      b.addEventListener('mousedown', function (e) {
        e.preventDefault(); // prevent stealing focus
      });
      b.addEventListener('click', function () {
        var target = self._lastFocusedInput;
        if (!target) return;
        var start = target.selectionStart || 0;
        var end = target.selectionEnd || 0;
        var val = target.value;
        target.value = val.slice(0, start) + sym.insert + val.slice(end);
        var newPos = start + sym.insert.length;
        // Place cursor inside parentheses if applicable
        if (sym.insert.endsWith('(')) newPos = start + sym.insert.length;
        else if (sym.insert === '()') newPos = start + 1;
        target.setSelectionRange(newPos, newPos);
        target.focus();
        target.dispatchEvent(new Event('input', { bubbles: true }));
      });
      bar.appendChild(b);
    });

    return bar;
  }

  _trackFocus(inputEl) {
    var self = this;
    inputEl.addEventListener('focus', function () {
      self._lastFocusedInput = inputEl;
    });
  }

  _buildTemplateField(label, key, value, placeholder) {
    var wrap = _el('div', 've-tpl-field');
    var lbl = _el('label', 've-tpl-label');
    lbl.textContent = label;
    wrap.appendChild(lbl);

    var inp = _el('textarea', 've-tpl-input');
    inp.value = value || '';
    inp.placeholder = placeholder || '';
    inp.rows = 1;
    // Auto-resize
    inp.style.height = 'auto';
    inp.style.height = Math.max(32, inp.scrollHeight) + 'px';

    var self = this;
    this._trackFocus(inp);

    var pendingRender = null;
    inp.addEventListener('input', function () {
      if (self._rendering) return;
      inp.style.height = 'auto';
      inp.style.height = Math.max(32, inp.scrollHeight) + 'px';

      if (key === 'questionTemplate') {
        self.questionTemplate = inp.value;
      } else if (key === 'answerTemplate') {
        self.answerTemplate = inp.value;
      } else if (key === 'guideTemplate') {
        self.guideTemplate = inp.value;
      } else if (key.startsWith('distractor-')) {
        var idx = parseInt(key.split('-')[1]);
        self.distractorTemplates[idx] = inp.value;
      }

      // Lightweight updates (no full re-render)
      var oldVarCount = self.varOrder.length;
      self._detectVarsFromTemplates();
      var previewEl = self.container.querySelector('.ve-template-preview');
      if (previewEl) previewEl.innerHTML = self._renderHighlightedTemplate(self.questionTemplate);

      if (key === 'questionTemplate') {
        self._autoDetectExpression();
      }

      // Only re-render if variable count changed (new cards needed)
      if (self.varOrder.length !== oldVarCount) {
        clearTimeout(pendingRender);
        pendingRender = setTimeout(function () { self.render(); }, 300);
      }

      self.onChange();
    });
    wrap.appendChild(inp);
    return wrap;
  }

  _buildTypeToggle() {
    var wrap = _el('div', 've-type-toggle');
    var self = this;

    var mcBtn = _el('button', 've-type-btn' + (this.questionType === 'mc' ? ' active' : ''));
    mcBtn.textContent = 'Multiple Choice';
    mcBtn.addEventListener('click', function () {
      self.questionType = 'mc';
      self.render();
      self.onChange();
    });

    var oeBtn = _el('button', 've-type-btn' + (this.questionType === 'oe' ? ' active' : ''));
    oeBtn.textContent = 'Open Ended';
    oeBtn.addEventListener('click', function () {
      self.questionType = 'oe';
      self.distractorExprs = [];
      self.render();
      self.onChange();
    });

    wrap.appendChild(mcBtn);
    wrap.appendChild(oeBtn);
    return wrap;
  }

  _buildDistractorConfig() {
    var wrap = _el('div', 've-distractor-section');
    var self = this;

    var lbl = _el('label', 've-tpl-label');
    lbl.textContent = 'Wrong Answer Expressions (optional)';
    wrap.appendChild(lbl);

    var hint = _el('div', 've-helper-text');
    hint.textContent = 'Use expressions (e.g. a - b) or fixed values (e.g. 42, slope, y-intercept). Leave empty for auto-generated.';
    hint.style.marginBottom = '0.3rem';
    wrap.appendChild(hint);

    // Ensure at least 3 slots
    while (this.distractorExprs.length < 3) this.distractorExprs.push('');

    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var row = _el('div', 've-distractor-row');
        var label = _el('span', 've-distractor-label');
        label.textContent = 'Wrong ' + (idx + 1) + ':';
        row.appendChild(label);

        var inp = _el('input', 've-answer-input');
        inp.type = 'text';
        inp.value = self.distractorExprs[idx] || '';
        inp.placeholder = idx === 0 ? 'e.g. a - b  or  42' : idx === 1 ? 'e.g. a * b  or  slope' : 'e.g. a + b + 1  or  none';
        self._trackFocus(inp);
        inp.addEventListener('input', function () {
          self.distractorExprs[idx] = inp.value;
          self.onChange();
        });
        row.appendChild(inp);
        wrap.appendChild(row);
      })(i);
    }

    return wrap;
  }

  _buildAnswerField() {
    var wrap = _el('div', 've-tpl-field');
    var lbl = _el('label', 've-tpl-label');
    lbl.textContent = 'Correct Answer';
    wrap.appendChild(lbl);

    var self = this;

    // Determine current mode: expression or literal
    // If answerTemplate is like {{something}} with a computed var, show expression mode
    var exprMatch = this.answerTemplate.match(/^\{\{(\w+)\}\}$/);
    var computedVar = exprMatch ? this.variables[exprMatch[1]] : null;
    var isExpression = computedVar && computedVar.type === 'computed';
    var currentExpr = isExpression ? (computedVar.expression || '') : '';
    var currentLiteral = isExpression ? '' : this.answerTemplate;

    // Mode toggle
    var modeRow = _el('div', 've-answer-mode');
    var exprBtn = _el('button', 've-mode-btn' + (isExpression ? ' active' : ''));
    exprBtn.textContent = 'Expression';
    exprBtn.title = 'Calculate answer from variables (e.g. a + b)';
    var litBtn = _el('button', 've-mode-btn' + (!isExpression ? ' active' : ''));
    litBtn.textContent = 'Fixed Value';
    litBtn.title = 'Type a specific answer or use {{variable}}';

    var inputArea = _el('div');

    function showExprMode() {
      exprBtn.className = 've-mode-btn active';
      litBtn.className = 've-mode-btn';
      inputArea.innerHTML = '';

      var inp = _el('input', 've-answer-input');
      inp.type = 'text';
      inp.value = currentExpr;
      inp.placeholder = 'e.g. a + b, a * b, Math.sin(a), Math.pow(a, 2)';
      self._trackFocus(inp);
      inp.addEventListener('input', function () {
        currentExpr = inp.value;
        self._setAnswerExpression(currentExpr);
        if (self.variables['_ans']) self.variables['_ans']._userEdited = true;
        self.onChange();
      });
      inputArea.appendChild(inp);

      var hint = _el('div', 've-helper-text');
      var varNames = self.varOrder.filter(function(n) {
        var v = self.variables[n];
        return v && v.kind !== 'operator' && v.type !== 'computed';
      });
      hint.textContent = varNames.length
        ? 'Variables: ' + varNames.join(', ') + ' | Operators: +, -, *, / | Functions: Math.sin(), Math.cos(), Math.sqrt(), Math.pow(), Math.abs(), Math.round()'
        : 'Add value variables first, then reference them here';
      inputArea.appendChild(hint);
    }

    function showLitMode() {
      litBtn.className = 've-mode-btn active';
      exprBtn.className = 've-mode-btn';
      inputArea.innerHTML = '';

      var inp = _el('input', 've-answer-input');
      inp.type = 'text';
      inp.value = currentLiteral;
      inp.placeholder = 'Type the answer or use {{variable}}';
      self._trackFocus(inp);
      inp.addEventListener('input', function () {
        currentLiteral = inp.value;
        // Remove any _ans computed variable
        if (self.variables['_ans']) {
          delete self.variables['_ans'];
          self.varOrder = self.varOrder.filter(function(n) { return n !== '_ans'; });
        }
        self.answerTemplate = currentLiteral;
        self._detectVarsFromTemplates();
        self.onChange();
      });
      inputArea.appendChild(inp);
    }

    exprBtn.addEventListener('click', function () {
      isExpression = true;
      showExprMode();
      // Initialize with empty expression
      if (!currentExpr) self._setAnswerExpression('');
    });
    litBtn.addEventListener('click', function () {
      isExpression = false;
      // Remove computed _ans variable
      if (self.variables['_ans']) {
        delete self.variables['_ans'];
        self.varOrder = self.varOrder.filter(function(n) { return n !== '_ans'; });
      }
      showLitMode();
    });

    modeRow.appendChild(exprBtn);
    modeRow.appendChild(litBtn);
    wrap.appendChild(modeRow);
    wrap.appendChild(inputArea);

    if (isExpression) showExprMode();
    else showLitMode();

    return wrap;
  }

  /** Set the answer to a computed expression (creates/updates a hidden _ans variable) */
  _setAnswerExpression(expr) {
    // Create or update a hidden computed variable for the answer
    if (!this.variables['_ans']) {
      this.variables['_ans'] = {
        name: '_ans',
        kind: 'value',
        type: 'computed',
        original: '',
        min: 0, max: 0, step: 1,
        choices: [], label: '',
        operators: []
      };
      this.varOrder.push('_ans');
    }
    this.variables['_ans'].expression = expr;
    this.answerTemplate = '{{_ans}}';
  }

  _buildVarCard(name) {
    var v = this.variables[name];
    var card = _el('div', 've-var-card');
    var self = this;

    // Header row: name + kind toggle + delete
    var header = _el('div', 've-var-header');
    var nameSpan = _el('span', 've-var-name');
    nameSpan.textContent = '{{' + name + '}}';
    header.appendChild(nameSpan);

    // Kind toggle: Value | Operator
    var kindToggle = _el('div', 've-kind-toggle');
    var valBtn = _el('button', 've-kind-btn' + (v.kind !== 'operator' ? ' active' : ''));
    valBtn.textContent = 'Value';
    valBtn.addEventListener('click', function () {
      v.kind = 'value';
      self.render();
      self.onChange();
    });
    var opBtn = _el('button', 've-kind-btn' + (v.kind === 'operator' ? ' active' : ''));
    opBtn.textContent = 'Operator';
    opBtn.addEventListener('click', function () {
      v.kind = 'operator';
      if (!v.operators || !v.operators.length) v.operators = ['+', '-', '*', '/'];
      self.render();
      self.onChange();
    });
    kindToggle.appendChild(valBtn);
    kindToggle.appendChild(opBtn);
    header.appendChild(kindToggle);

    var delBtn = _el('button', 've-var-del');
    delBtn.textContent = '\u00d7';
    delBtn.title = 'Remove variable';
    delBtn.addEventListener('click', function () {
      // Remove {{name}} from templates and convert back to original or remove
      var orig = v.original || name;
      self.questionTemplate = self.questionTemplate.replace(new RegExp('\\{\\{' + name + '\\}\\}', 'g'), orig);
      self.answerTemplate = self.answerTemplate.replace(new RegExp('\\{\\{' + name + '\\}\\}', 'g'), orig);
      self.distractorTemplates = self.distractorTemplates.map(function (d) {
        return d.replace(new RegExp('\\{\\{' + name + '\\}\\}', 'g'), orig);
      });
      self.guideTemplate = self.guideTemplate.replace(new RegExp('\\{\\{' + name + '\\}\\}', 'g'), orig);
      delete self.variables[name];
      self.varOrder = self.varOrder.filter(function (n) { return n !== name; });
      self.render();
      self.onChange();
    });
    header.appendChild(delBtn);
    card.appendChild(header);

    // Config body
    var body = _el('div', 've-var-body');

    if (v.kind === 'operator') {
      // Operator config: checkboxes for each operator
      var opLabel = _el('div', 've-field-label');
      opLabel.textContent = 'Operators to include:';
      body.appendChild(opLabel);

      var opGrid = _el('div', 've-op-grid');
      var allOps = [
        { sym: '+', label: 'Add (+)', val: '+' },
        { sym: '\u2212', label: 'Subtract (\u2212)', val: '-' },
        { sym: '\u00d7', label: 'Multiply (\u00d7)', val: '*' },
        { sym: '\u00f7', label: 'Divide (\u00f7)', val: '/' }
      ];
      var ops = v.operators || ['+', '-', '*', '/'];
      allOps.forEach(function (op) {
        var opItem = _el('label', 've-op-item');
        var cb = _el('input');
        cb.type = 'checkbox';
        cb.checked = ops.indexOf(op.val) >= 0;
        cb.addEventListener('change', function () {
          if (cb.checked) {
            if (ops.indexOf(op.val) < 0) ops.push(op.val);
          } else {
            ops = ops.filter(function (o) { return o !== op.val; });
          }
          v.operators = ops;
          self.onChange();
        });
        opItem.appendChild(cb);
        var opText = document.createTextNode(' ' + op.label);
        opItem.appendChild(opText);
        opGrid.appendChild(opItem);
      });
      body.appendChild(opGrid);

    } else if (v.type === 'computed') {
      // Computed: expression field
      var exprRow = this._fieldRow('Expression', v.expression || '', function (val) {
        v.expression = val;
        self.onChange();
      });
      body.appendChild(exprRow);
      var helper = _el('div', 've-helper-text');
      helper.textContent = 'Use variable names: ' + self.varOrder.map(function (n) { return n; }).join(', ');
      body.appendChild(helper);

    } else if (v.type === 'word-choice') {
      // Word choice: textarea for choices
      var choiceLabel = _el('div', 've-field-label');
      choiceLabel.textContent = 'Choices (one per line):';
      body.appendChild(choiceLabel);
      var ta = _el('textarea', 've-choice-input');
      ta.value = (v.choices || []).join('\n');
      ta.rows = 3;
      ta.addEventListener('change', function () {
        v.choices = ta.value.split('\n').filter(Boolean);
        self.onChange();
      });
      body.appendChild(ta);

    } else {
      // Value config: type, min, max, step
      var typeRow = _el('div', 've-config-row');

      // Type selector
      var typeWrap = _el('div', 've-config-field');
      var typeLbl = _el('label');
      typeLbl.textContent = 'Type';
      typeWrap.appendChild(typeLbl);
      var typeSel = _selEl(
        ['integer', 'decimal', 'fraction', 'currency', 'percent', 'word-choice', 'computed'],
        v.type || 'integer',
        function (val) {
          v.type = val;
          self.render();
          self.onChange();
        }
      );
      typeWrap.appendChild(typeSel);
      typeRow.appendChild(typeWrap);

      // Min
      var minWrap = _el('div', 've-config-field');
      var minLbl = _el('label');
      minLbl.textContent = 'Min';
      minWrap.appendChild(minLbl);
      var minInp = _el('input', 've-config-input');
      minInp.type = 'number';
      minInp.value = v.min != null ? v.min : 1;
      minInp.addEventListener('change', function () {
        v.min = parseFloat(minInp.value) || 0;
        self.onChange();
      });
      minWrap.appendChild(minInp);
      typeRow.appendChild(minWrap);

      // Max
      var maxWrap = _el('div', 've-config-field');
      var maxLbl = _el('label');
      maxLbl.textContent = 'Max';
      maxWrap.appendChild(maxLbl);
      var maxInp = _el('input', 've-config-input');
      maxInp.type = 'number';
      maxInp.value = v.max != null ? v.max : 100;
      maxInp.addEventListener('change', function () {
        v.max = parseFloat(maxInp.value) || 100;
        self.onChange();
      });
      maxWrap.appendChild(maxInp);
      typeRow.appendChild(maxWrap);

      // Step (for decimal/currency)
      if (v.type === 'decimal' || v.type === 'currency') {
        var stepWrap = _el('div', 've-config-field');
        var stepLbl = _el('label');
        stepLbl.textContent = 'Step';
        stepWrap.appendChild(stepLbl);
        var stepInp = _el('input', 've-config-input');
        stepInp.type = 'number';
        stepInp.value = v.step || 0.01;
        stepInp.step = '0.01';
        stepInp.addEventListener('change', function () {
          v.step = parseFloat(stepInp.value) || 0.01;
          self.onChange();
        });
        stepWrap.appendChild(stepInp);
        typeRow.appendChild(stepWrap);
      }

      body.appendChild(typeRow);
    }

    card.appendChild(body);
    return card;
  }

  _renderHighlightedTemplate(tmpl) {
    if (!tmpl) return '<span class="ve-empty-hint">Type your question using {{variableName}} for variables</span>';
    var escaped = _escHtml(tmpl);
    return escaped.replace(/\{\{(\w+)\}\}/g, function (m, name) {
      return '<span class="ve-var-highlight">{{' + name + '}}</span>';
    });
  }

  _generatePreview() {
    var liveEl = this.container.querySelector('.ve-live-content');
    if (!liveEl) return;
    if (!this.varOrder.length) {
      liveEl.innerHTML = '<span class="ve-empty-hint">Add variables to see a preview</span>';
      return;
    }
    try {
      var result = this.preview();
      var html = '<div class="ve-preview-q"><strong>Q:</strong> ' + _escHtml(result.q) + '</div>';
      html += '<div class="ve-preview-ans"><strong>Answer:</strong> ' + _escHtml(result.ans) + '</div>';
      if (result.distractors && result.distractors.length) {
        html += '<div class="ve-preview-dist"><strong>Options:</strong> ' + result.distractors.map(_escHtml).join(', ') + '</div>';
      }
      if (result.guide) {
        html += '<div class="ve-preview-guide"><strong>Guide:</strong> ' + _escHtml(result.guide) + '</div>';
      }
      liveEl.innerHTML = html;
    } catch (e) {
      liveEl.innerHTML = '<span class="ve-error">Preview error: ' + _escHtml(e.message) + '</span>';
    }
  }

  _fieldRow(label, value, onChange, type) {
    var row = _el('div', 've-config-row');
    var wrap = _el('div', 've-config-field');
    var lbl = _el('label');
    lbl.textContent = label;
    wrap.appendChild(lbl);
    var inp = _el('input', 've-config-input');
    inp.type = type || 'text';
    inp.value = value;
    inp.addEventListener('change', function () { onChange(inp.value); });
    wrap.appendChild(inp);
    row.appendChild(wrap);
    return row;
  }

  // ---- Internal helpers -----------------------------------------------------

  _nextVarName(idx, usedNames) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    // Try single letters first
    for (var i = 0; i < letters.length; i++) {
      var candidate = letters[i];
      if (!usedNames[candidate]) return candidate;
    }
    // Fallback
    return 'v' + idx;
  }

  _inferVarFromToken(token) {
    var type = 'integer';
    var min = 1, max = 100, step = 1;

    if (/^\d+\s+\d+\/\d+$/.test(token) || /^\d+\/\d+$/.test(token)) {
      type = 'fraction';
    } else if (/^\$/.test(token)) {
      type = 'currency';
      step = 0.01;
    } else if (/%$/.test(token)) {
      type = 'percent';
    } else if (/\./.test(token)) {
      type = 'decimal';
      step = 0.01;
    }

    var range = (typeof computeRange === 'function') ? computeRange(parseFloat(token.replace(/[,$%]/g, ''))) : { min: 1, max: 100 };
    min = range.min;
    max = range.max;

    return {
      kind: 'value',
      type: type,
      original: token,
      min: min,
      max: max,
      step: step,
      choices: [],
      expression: '',
      label: '',
      operators: []
    };
  }

  /** Auto-detect math expression from question template and prefill answer.
   *  Called on every question template change. Updates in-place without re-rendering. */
  _autoDetectExpression() {
    var tmpl = this.questionTemplate;
    if (!tmpl) return;

    // If user already typed a non-empty expression, don't overwrite
    if (this.variables['_ans'] && this.variables['_ans'].expression &&
        this.variables['_ans']._userEdited) return;

    // Map display operators to JS operators
    var opMap = {
      '+': '+', '-': '-',
      '\u00d7': '*', '\u00f7': '/',
      '*': '*', '/': '/',
      'x': '*', 'X': '*'
    };

    // Pattern: {{a}} op {{b}} or {{a}} op {{b}} op {{c}}
    var re = /\{\{(\w+)\}\}\s*([+\-\u00d7\u00f7*\/xX])\s*\{\{(\w+)\}\}/g;
    var match = re.exec(tmpl);
    if (!match) return;

    var expr = match[1] + ' ' + (opMap[match[2]] || match[2]) + ' ' + match[3];

    // Check for a third operand
    var rest = tmpl.slice(match.index + match[0].length);
    var re2 = /^\s*([+\-\u00d7\u00f7*\/xX])\s*\{\{(\w+)\}\}/;
    var match2 = re2.exec(rest);
    if (match2) {
      expr += ' ' + (opMap[match2[1]] || match2[1]) + ' ' + match2[2];
    }

    // Set the expression without re-rendering (update the input in-place if it exists)
    this._setAnswerExpression(expr);
    var ansInput = this.container.querySelector('.ve-answer-input');
    if (ansInput) ansInput.value = expr;
  }

  _detectVarsFromTemplates() {
    var allText = [this.questionTemplate, this.answerTemplate, this.guideTemplate]
      .concat(this.distractorTemplates).join(' ');
    var re = /\{\{(\w+)\}\}/g;
    var match;
    var seen = {};
    var newOrder = [];

    while ((match = re.exec(allText)) !== null) {
      var name = match[1];
      if (!seen[name]) {
        seen[name] = true;
        newOrder.push(name);
        // Keep existing config if variable already exists
        if (!this.variables[name]) {
          this.variables[name] = {
            name: name,
            kind: 'value',
            type: 'integer',
            original: '',
            min: 1,
            max: 100,
            step: 1,
            choices: [],
            expression: '',
            label: '',
            operators: []
          };
        }
      }
    }

    // Remove variables no longer in any template
    var self = this;
    Object.keys(this.variables).forEach(function (name) {
      if (!seen[name]) delete self.variables[name];
    });
    this.varOrder = newOrder;
  }

  _addNewVariable() {
    var name = this._nextVarName(this.varOrder.length, this.variables);
    this.variables[name] = {
      name: name,
      kind: 'value',
      type: 'integer',
      original: '',
      min: 1,
      max: 100,
      step: 1,
      choices: [],
      expression: '',
      label: '',
      operators: []
    };
    this.varOrder.push(name);
    // Insert {{name}} at end of question template
    this.questionTemplate = (this.questionTemplate ? this.questionTemplate + ' ' : '') + '{{' + name + '}}';
    this.render();
    this.onChange();
  }

  _resolveTemplate(tmpl) {
    if (!tmpl) return '';
    var self = this;
    return tmpl.replace(/\{\{(\w+)\}\}/g, function (m, name) {
      var v = self.variables[name];
      return v && v.original ? v.original : m;
    });
  }
}

// ---- Standalone generator ---------------------------------------------------

function generateFromDescriptor(descriptor) {
  var slots = descriptor.slots || [];
  var vals = [];

  // Generate values for each slot
  for (var i = 0; i < slots.length; i++) {
    var s = slots[i];
    if (s.type === 'computed') {
      vals[i] = null; // computed after independent slots
    } else if (s.kind === 'operator' || (s.operators && s.operators.length)) {
      // Operator variable: pick a random operator
      var ops = s.operators || ['+', '-', '*', '/'];
      vals[i] = ops[rand(0, ops.length - 1)];
    } else if (s.type === 'word-choice' && s.choices && s.choices.length) {
      vals[i] = s.choices[rand(0, s.choices.length - 1)];
    } else if (s.type === 'fraction') {
      vals[i] = (typeof randomizeToken === 'function') ? randomizeToken(s.original) : s.original;
    } else {
      var min = s.min != null ? s.min : 1;
      var max = s.max != null ? s.max : 100;
      var step = s.step || 1;
      if (s.type === 'decimal' || s.type === 'currency') {
        var scale = Math.round(1 / step);
        vals[i] = rand(Math.round(min * scale), Math.round(max * scale)) / scale;
      } else if (s.type === 'percent') {
        vals[i] = rand(min, max);
      } else {
        vals[i] = rand(min, max);
      }
    }
  }

  // Resolve computed slots
  for (var i = 0; i < slots.length; i++) {
    if (slots[i].type === 'computed' && slots[i].expression) {
      var expr = slots[i].expression;
      // Build a vals-based expression, also support variable names
      var safeExpr = expr;
      // Replace variable names with vals[index]
      for (var j = 0; j < slots.length; j++) {
        if (slots[j].name) {
          safeExpr = safeExpr.replace(new RegExp('\\b' + slots[j].name + '\\b', 'g'), 'vals[' + j + ']');
        }
      }
      if (_isSafeExpr(safeExpr)) {
        try { vals[i] = new Function('vals', 'return ' + safeExpr)(vals); } catch (e) { vals[i] = 0; }
      } else { vals[i] = 0; }
    }
  }

  function formatVal(idx) {
    var s = slots[idx]; var v = vals[idx];
    if (s.kind === 'operator' || (s.operators && s.operators.length)) {
      // Format operator symbols for display
      var opMap = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
      return opMap[v] || v;
    }
    if (s.type === 'currency') return '$' + Number(v).toFixed(2);
    if (s.type === 'percent') return v + '%';
    if (s.type === 'decimal') return Number(v).toFixed(s.step ? String(s.step).split('.')[1]?.length || 2 : 2);
    if (s.type === 'fraction' || s.type === 'word-choice') return String(v);
    if (s.type === 'computed') {
      if (typeof v === 'number') {
        if (Number.isInteger(v)) return v.toString();
        return parseFloat(v.toFixed(4)).toString();
      }
      return String(v);
    }
    return String(Math.round(v));
  }

  function fill(tmpl) {
    if (!tmpl) return '';
    return tmpl.replace(/\$?\{(\d+)\}/g, function (m, idx) {
      var i = parseInt(idx);
      if (i < vals.length) {
        var isCurrency = m.startsWith('$');
        if (isCurrency && slots[i].type !== 'currency') return '$' + formatVal(i);
        return formatVal(i);
      }
      return m;
    });
  }

  var q = fill(descriptor.textTemplate);
  var ans = fill(descriptor.answerTemplate);
  var distractors = (descriptor.distractorTemplates || []).map(fill).filter(Boolean);
  var guide = fill(descriptor.guideTemplate);

  // Evaluate custom distractor expressions if provided
  if (distractors.length === 0 && descriptor.distractorExprs && descriptor.distractorExprs.length) {
    descriptor.distractorExprs.forEach(function (expr) {
      if (!expr || !expr.trim()) return;
      expr = expr.trim();

      // Try as a math expression first (replace variable names with vals[index])
      var safeExpr = expr;
      var hasVarRef = false;
      for (var di = 0; di < slots.length; di++) {
        if (slots[di].name && new RegExp('\\b' + slots[di].name + '\\b').test(safeExpr)) {
          safeExpr = safeExpr.replace(new RegExp('\\b' + slots[di].name + '\\b', 'g'), 'vals[' + di + ']');
          hasVarRef = true;
        }
      }

      if (hasVarRef && _isSafeExpr(safeExpr)) {
        // It references variables -- evaluate as expression
        try {
          var val = new Function('vals', 'return ' + safeExpr)(vals);
          if (val != null) {
            var formatted = typeof val === 'number'
              ? (Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(4)).toString())
              : String(val);
            if (formatted !== ans) distractors.push(formatted);
          }
        } catch (e) { /* skip bad expressions */ }
      } else {
        // Fixed value -- use as-is (string or number literal)
        if (expr !== ans) distractors.push(expr);
      }
    });
  }

  // Auto-generate distractors if still none and answer is numeric
  if (distractors.length === 0) {
    var ansNum = parseFloat(ans);
    if (!isNaN(ansNum)) {
      var distSet = {};
      var ansStr = ans;
      // Generate plausible wrong answers near the correct one
      var offsets = [1, -1, 2, -2, 10, -10, 5, -5];
      // Also try common mistakes: off-by-one in each operand direction
      for (var di = 0; di < vals.length; di++) {
        if (typeof vals[di] === 'number') {
          offsets.push(vals[di]);
          offsets.push(-vals[di]);
        }
      }
      for (var oi = 0; oi < offsets.length && Object.keys(distSet).length < 3; oi++) {
        var d = ansNum + offsets[oi];
        var dStr = Number.isInteger(d) ? d.toString() : parseFloat(d.toFixed(4)).toString();
        if (dStr !== ansStr && d > 0 && !distSet[dStr]) {
          distSet[dStr] = true;
        }
      }
      // Fallback: random nearby values
      while (Object.keys(distSet).length < 3) {
        var r = ansNum + (rand(1, 10) * (rand(0, 1) ? 1 : -1));
        var rStr = Number.isInteger(r) ? r.toString() : parseFloat(r.toFixed(4)).toString();
        if (rStr !== ansStr && r > 0 && !distSet[rStr]) {
          distSet[rStr] = true;
        }
      }
      distractors = Object.keys(distSet).slice(0, 3);
    }
  }

  return { q: q, ans: ans, distractors: distractors, guide: guide };
}

// ---- DOM helpers (internal, prefixed to avoid collision) ---------------------

function _el(tag, cls) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function _btn(label, handler) {
  var b = _el('button', 've-btn');
  b.textContent = label;
  b.addEventListener('click', handler);
  return b;
}

function _selEl(options, current, onChange) {
  var sel = _el('select', 've-config-select');
  options.forEach(function (opt) {
    var o = _el('option');
    o.value = opt; o.textContent = opt;
    if (opt === current) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function () { onChange(sel.value); });
  return sel;
}

function _escHtml(str) {
  var d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
