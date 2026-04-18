/**
 * tb-core.js  --  Test Builder core logic
 * Extracted from inline script in test-builder.html
 * Dependencies: utils.js, dynamic-gen.js, variable-editor.js, templates.js, extra-templates.js, firebase-config.js
 */

// ===== STATE =====
const TBState = {
    questions: [],
    selected: new Set(),
    editing: new Set(),
    drawTarget: null,
    drawTool: 'pen',
    drawColor: '#000',
    drawWidth: 2,
    drawListenersAttached: false,
    drawing: false,
    skillData: [],
    savedSkillsCache: null,
    currentTestId: null,
    aiFileB64: null,
    aiFileMime: null
};

// Convenience aliases (keep code terse)
const tbQuestions    = TBState.questions;
function _editing()  { return TBState.editing; }
function _selected() { return TBState.selected; }

// ===== SKILL NAMES =====
const SKILL_NAMES = {
    'Addition2Digit':'2-Digit Addition','Addition3Digit':'3-Digit Addition','Subtraction2Digit':'2-Digit Subtraction','Subtraction3Digit':'3-Digit Subtraction',
    'MultiplyBasic':'Basic Multiplication','MultiplyBy10':'Multiply by 10/100','DivideBasic':'Basic Division','DivideWithRemainder':'Division with Remainders',
    'PlaceValueIdentify':'Place Value','ExpandedForm':'Expanded Form','CompareLargeNumbers':'Compare Numbers','SkipCounting':'Skip Counting',
    'FractionOfShape':'Fraction of a Shape','CompareFractions':'Compare Fractions','AddFractionsLikeDenom':'Add Fractions (Like Denom.)',
    'PerimeterRect':'Perimeter','AreaRect':'Area of Rectangle','ArrayModel':'Array Multiplication',
    'LongMultiplication':'Long Multiplication','Multiply3x1':'3-Digit x 1-Digit','LongDivision':'Long Division','LongDivision2Digit':'Long Division (2-Digit)',
    'DivisionNoRemainder':'Division (No Remainder)','AddDecimals':'Add Decimals','SubtractDecimals':'Subtract Decimals',
    'FractionToDecimal':'Fraction to Decimal','DecimalToFraction':'Decimal to Fraction','MixedToImproper':'Mixed to Improper','ImproperToMixed':'Improper to Mixed',
    'AddFractionsDiffDenom':'Add Fractions (Unlike Denom.)','SubtractFractions':'Subtract Fractions','FactorPairs':'Factor Pairs',
    'PrimeOrComposite':'Prime or Composite','MultiplesList':'Multiples','RoundDecimals':'Round Decimals','AngleMeasure':'Classify Angles',
    'OrderOfOps':'Order of Operations','OrderOfOps5':'Order of Operations (PEMDAS)','InputOutputTable':'Input/Output Tables',
    'MultiplyDecimals':'Multiply Decimals','DivideDecimals':'Divide Decimals','MultiplyFractions':'Multiply Fractions','DivideFractions':'Divide Fractions',
    'MultiplyMixed':'Multiply Mixed Numbers','AddMixedNumbers':'Add Mixed Numbers','SubtractMixedNumbers':'Subtract Mixed Numbers',
    'SimplifyFractions':'Simplify Fractions','FractionDecimalPercent':'Fraction / Decimal / %','PercentOfNumber':'Percent of a Number',
    'DecimalPlaceValue':'Decimal Place Value','ExponentEvaluate':'Evaluate Exponents','VolumeRectPrism':'Volume (Rect. Prism)',
    'NumericalExpressions':'Numerical Expressions','GCFFind':'GCF','LCMFind':'LCM','EquivalentFractions':'Equivalent Fractions','CompareDecimals':'Compare Decimals',
    'IntegerAddition':'Add Integers','IntegerSubtraction':'Subtract Integers','IntegerMultiplication':'Multiply Integers','IntegerDivision':'Divide Integers',
    'AbsoluteValueCalc':'Absolute Value','OrderIntegers':'Order Integers','RatioSimplify':'Simplify Ratios','UnitRateCalc':'Unit Rates',
    'ProportionSolve':'Solve Proportions','PercentToDecimal':'Percent to Decimal','DecimalToPercent':'Decimal to Percent',
    'PercentOfNumber6':'Percent of a Number','PercentChange':'Percent Change','OneStepEquationAdd':'One-Step Equations (+/-)',
    'OneStepEquationMult':'One-Step Equations (x/div)','OneStepInequality':'One-Step Inequalities','DistributiveProperty':'Distributive Property',
    'CombineLikeTerms':'Combine Like Terms','AreaTriangleCalc':'Area of Triangle','AreaParallelogramCalc':'Area of Parallelogram',
    'SurfaceAreaBox':'Surface Area','MeanCalc':'Mean','MedianCalc':'Median','ModeCalc':'Mode','RangeCalc':'Range','ExpressionEvaluate':'Evaluate Expressions',
    'AddRational':'Add Rationals','SubtractRational':'Subtract Rationals','MultiplyRational':'Multiply Rationals','DivideRational':'Divide Rationals',
    'ConstantOfProp':'Constant of Proportionality','PercentMarkup':'Percent Markup','PercentMarkdown':'Percent Markdown',
    'PercentTaxCalc':'Sales Tax','PercentTipCalc':'Calculate Tip','SimpleInterest':'Simple Interest',
    'TwoStepEquation':'Two-Step Equations','TwoStepInequality':'Two-Step Inequalities','DistributiveEquation':'Equations w/ Distribution',
    'ComplementaryAngles':'Complementary Angles','SupplementaryAngles':'Supplementary Angles','TriangleAngleSum':'Triangle Angle Sum',
    'CircumferenceCalc':'Circumference','CircleAreaCalc':'Circle Area','ScaleFactorCalc':'Scale Factor',
    'ProbabilityCalc':'Probability','CompoundProbCalc':'Compound Probability',
    'SciNotationConvert':'Sci. Notation (Convert)','SciNotationToStandard':'Sci. Notation to Standard','SciNotationMultiply':'Sci. Notation (Multiply)',
    'ExponentProductRule':'Exponent Product Rule','ExponentQuotientRule':'Exponent Quotient Rule','ExponentPowerRule':'Exponent Power Rule',
    'NegativeExponents':'Negative Exponents','SquareRootCalc':'Square Roots','CubeRootCalc':'Cube Roots','IrrationalApprox':'Irrational Approximation',
    'PythagoreanCalc':'Pythagorean Theorem','PythagoreanConverse':'Pythagorean Converse',
    'SlopeFromTwoPoints':'Slope from Points','SlopeInterceptForm':'Slope-Intercept Form','PointSlopeConvert':'Point-Slope Form',
    'XYIntercepts':'X & Y Intercepts','ParallelSlopes':'Parallel Slopes','PerpendicularSlopes':'Perpendicular Slopes',
    'SystemSubstitutionCalc':'Systems (Substitution)','SystemEliminationCalc':'Systems (Elimination)',
    'FunctionEvalCalc':'Evaluate Functions','FunctionTableRule':'Function Rules','TranslateCoord':'Translations',
    'ReflectCoord':'Reflections','DilateCoord':'Dilations','VolumeComposite':'Volume (Cyl/Cone/Sphere)',
    'Rounding':'Rounding','Mult 10s':'Multiply Multiples of 10','Comparison':'Compare Numbers','Fraction ID':'Identify Fractions',
    'Equivalent Fractions':'Equivalent Fractions','Whole Frac':'Whole Number Fractions','Division Exp':'Division Expressions',
    'Prop Strategy':'Associative Property','Partition':'Partition Shapes','Polygons':'Polygon Properties',
    'Volume Est':'Estimate Volume','Money':'Money & Change','Time':'Tell Time','Area Mult':'Area',
    'Perimeter':'Perimeter','Data Plots':'Line Plots','UnknownFactor':'Unknown Factor','BikeFrac':'Fractions (Word)',
    'ArrayDiv':'Division Arrays','RepeatAdd':'Repeated Addition','Pattern':'Patterns','MassEst':'Estimate Mass',
    'Elapsed':'Elapsed Time','BarData':'Bar Graphs','FracSize':'Compare Unit Fractions','MultCtx':'Multiplication Word Problems',
    'DivCtx':'Division Word Problems','EvenOdd':'Even or Odd','Half':'Halfway Point',
    'Dec Frac':'Decimals & Fractions','Word Form':'Word Form','Remainders':'Remainders','Multi-Step':'Multi-Step',
    'Frac Bench':'Compare Fractions','Frac Add':'Add Fractions','Dec Comp':'Compare Decimals',
    'Powers 10':'Powers of 10','Coordinates':'Coordinates','Volume':'Volume','Base Area':'Volume (Base Area)',
    'Mult Frac':'Fraction of Whole','Mixed Sub':'Subtract Mixed','Patterns':'Patterns',
    'Div Frac':'Divide Fractions','GCF':'GCF','Comp Integers':'Compare Integers','Ratio Lang':'Ratio Language',
    'Rate Table':'Rate Tables','Comp Rates':'Compare Rates','Equations':'Solve Equations','Variables':'Variables',
    'Trap Area':'Trapezoid Area','Surf Area':'Surface Area','Box Plot':'Box Plots','MAD':'Mean Abs. Deviation',
    'AbsVal':'Absolute Value','DecMult':'Multiply Decimals','Percents':'Percents','DistProp':'Distributive Property',
    'InEq':'Inequalities','AreaTri':'Triangle Area','Mean':'Mean','Mode':'Mode',
    'Int Add':'Add Integers','Avg Change':'Average Change','Rat Mult':'Multiply Rationals','Prop Logic':'Proportions',
    'Unit Rate':'Unit Rates','Ratio Eq':'Ratio Equations','Scaling':'Scaling','Simplify':'Simplify Expressions',
    'Discount':'Discounts','Scale Map':'Scale Drawings','Circle':'Circles','Angles':'Angles','Prob':'Probability',
    'Slope':'Slope','Systems':'Systems','Comp Func':'Compare Functions','Sphere':'Sphere Volume',
    'Roots':'Radicals','ConeVol':'Cone Volume','ExtAngle':'Exterior Angles','DistForm':'Distance Formula',
    'Transform':'Transformations','PerfectSquare':'Perfect Squares','Sci Note':'Scientific Notation',
    'Exponents':'Exponents','Pythag':'Pythagorean Theorem','Slope Int':'Slope-Intercept'
};

function skillName(t) {
    return SKILL_NAMES[t] || t.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1').trim();
}

// ===== UTILITY =====
function escHtml(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

// ===== PARSE =====
function tbParseText(raw) {
    var lines = raw.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l; });
    var questions = [];
    var cur = null, answerSection = false, answerList = [];

    function flush() {
        if (cur && cur.text && cur.options.length >= 2) {
            questions.push({ text: cur.text, correct: cur.correct, options: cur.options, openEnded: cur.openEnded, guide: cur.guide, isCustom: cur.isCustom, _dynamic: false, _descriptor: null, _equation: null, _drawingDataUrl: null });
        }
        cur = null;
    }

    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (/^answers?$/i.test(line)) { answerSection = true; flush(); continue; }
        if (answerSection) {
            var letters = line.match(/\b([A-D])\b/gi);
            if (letters) answerList = answerList.concat(letters.map(function(l){ return l.toUpperCase(); }));
            continue;
        }
        var qMatch = line.match(/^(\d+)[).]\s*(.+)/);
        if (qMatch) { flush(); cur = { text: qMatch[2], options: [], correct: '', openEnded: false, guide: '', isCustom: true }; continue; }
        var choiceMatch = line.match(/^([A-Da-d])[).]\s*(.+)/);
        if (choiceMatch && cur) { cur.options.push(choiceMatch[1].toUpperCase() + ') ' + choiceMatch[2]); continue; }
        if (cur && !cur.options.length) cur.text += ' ' + line;
    }
    flush();

    answerList.forEach(function(letter, i) {
        if (!questions[i]) return;
        var opt = questions[i].options.find(function(o){ return o.startsWith(letter + ')'); });
        if (opt) questions[i].correct = opt.replace(/^[A-D]\)\s*/, '');
    });
    questions.forEach(function(q) { if (!q.correct && q.options.length) q.correct = q.options[0].replace(/^[A-D]\)\s*/, ''); });
    return questions;
}

function tbProcessPaste() {
    var raw = document.getElementById('tb-paste').value.trim();
    if (!raw) return;
    var st = document.getElementById('tb-status');
    st.textContent = 'Processing...'; st.className = 'tb-status';
    var parsed = [];
    if (window.opener && typeof window.opener.fallbackParse === 'function') {
        try { parsed = window.opener.fallbackParse(raw); } catch(e) {}
    }
    if (!parsed.length) parsed = tbParseText(raw);
    if (!parsed.length) { st.textContent = 'No questions found -- check format.'; st.className = 'tb-status err'; return; }
    parsed.forEach(function(q) { q._dynamic = false; q._descriptor = null; q._equation = null; q._drawingDataUrl = null; });
    TBState.questions.push.apply(TBState.questions, parsed);
    st.textContent = parsed.length + ' question' + (parsed.length !== 1 ? 's' : '') + ' added.'; st.className = 'tb-status ok';
    document.getElementById('tb-paste').value = '';
    tbRender();
}

// ===== RENDER =====
function tbRender() {
    var list = document.getElementById('tb-list');
    var n = TBState.questions.length;
    document.getElementById('tb-count').textContent = n + ' question' + (n !== 1 ? 's' : '');
    document.getElementById('tb-save').style.display = n > 0 ? '' : 'none';
    if (!n) { list.innerHTML = '<div class="tb-empty">No questions yet. Generate from skills or paste problems.</div>'; return; }
    var rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : function(x){ return x; };
    var html = '';
    TBState.questions.forEach(function(q, i) {
        var isEdit = TBState.editing.has(i), isSel = TBState.selected.has(i);
        var opts = q.options || [], letters = ['A','B','C','D'];
        var cIdx = -1;
        opts.forEach(function(o, j) { if (o.replace(/^[A-D]\)\s*/i,'').trim() === q.correct || o.includes(q.correct)) cIdx = j; });

        // Badges
        var dynBadge = '';
        if (q._dynamic && q._descriptor) {
            var varCount = (q.variableDescriptor && q.variableDescriptor.slots) ? q.variableDescriptor.slots.length : (q._descriptor.slots ? q._descriptor.slots.length : 0);
            var varTip = varCount ? varCount + ' variable' + (varCount !== 1 ? 's' : '') : 'Dynamic';
            dynBadge = '<span class="tb-badge tb-badge-dyn" title="' + varTip + '">Dynamic</span>';
        } else {
            dynBadge = '<span class="tb-badge tb-badge-static">Static</span>';
        }
        var badges = dynBadge;
        var sp = q._spacing || 16;

        // Display body
        var display = '<div class="tb-card-body" style="' + (isEdit ? 'display:none;' : '') + '">';
        if (q.visualHTML) display += '<div style="margin-bottom:0.4rem;max-width:100%;overflow:hidden;text-align:center;">' + q.visualHTML + '</div>';
        display += '<div class="tb-q-text">' + rm(q.text || '<em style="color:var(--text-secondary);">Empty</em>') + '</div>';
        if (!q.openEnded && opts.length) {
            display += '<div class="tb-opts">';
            opts.forEach(function(o, j) {
                var letter = (o.match(/^([A-D])/) || [])[1];
                var optVis = letter && q.optionVisuals && q.optionVisuals[letter];
                display += '<div class="tb-opt ' + (j === cIdx ? 'correct' : '') + '">' + rm(o) + (optVis && optVis.visualHTML ? '<div style="margin-top:0.2rem;max-width:100%;overflow:hidden;">' + optVis.visualHTML + '</div>' : '') + '</div>';
            });
            display += '</div>';
        } else if (q.openEnded) {
            var aVis = q.answerVisual && q.answerVisual.visualHTML;
            display += '<div style="font-size:0.82rem;color:var(--text-secondary);">Answer: <strong>' + rm(q.correct) + '</strong>' + (aVis ? '<div style="margin-top:0.2rem;max-width:100%;overflow:hidden;">' + aVis + '</div>' : '') + '</div>';
        }
        display += '<div class="tb-badges">' +
            '<label style="font-size:0.78rem;cursor:pointer;display:flex;align-items:center;gap:0.2rem;">' +
            '<input type="checkbox" ' + (q._dynamic ? 'checked' : '') + ' onchange="tbToggleDynamic(' + i + ',this.checked)"> Dynamic</label>' +
            badges + '</div></div>';

        // Edit section
        var edit = '<div class="tb-edit ' + (isEdit ? 'open' : '') + '" id="tb-edit-' + i + '">' +
            '<label>Question</label><textarea id="tb-etext-' + i + '">' + (q.text || '').replace(/<br\s*\/?>/gi, '\n') + '</textarea>';
        if (!q.openEnded) {
            edit += '<label>Options (select correct)</label>';
            for (var j = 0; j < 4; j++) {
                var ot = (opts[j] || '').replace(/^[A-D]\)\s*/i, '').trim();
                edit += '<div class="tb-opt-edit"><input type="radio" name="tb-c-' + i + '" ' + (j === cIdx ? 'checked' : '') + ' value="' + j + '"><span style="font-weight:700;width:16px;">' + letters[j] + ')</span><input type="text" id="tb-eo-' + i + '-' + j + '" value="' + ot.replace(/"/g, '&quot;') + '"></div>';
            }
        } else {
            edit += '<label>Answer</label><input type="text" id="tb-ec-' + i + '" value="' + (q.correct || '').replace(/"/g, '&quot;') + '">';
        }
        // Variable editor container
        edit += '<div id="tb-var-editor-' + i + '" class="tb-var-editor-container" style="margin-top:0.5rem;"></div>';

        edit += '<div style="margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">' +
            '<button class="btn" onclick="tbApplyEdit(' + i + ')">Done</button>' +
            '<button class="btn" style="background:var(--bg-surface);color:var(--primary-color);border:1px solid var(--primary-color);font-size:0.75rem;" onclick="tbMakeDynamic(' + i + ')">Make Dynamic</button>' +
            '<label style="font-size:0.8rem;cursor:pointer;"><input type="checkbox" ' + (q._dynamic ? 'checked' : '') + ' onchange="tbToggleDynamic(' + i + ',this.checked)"> Dynamic</label></div></div>';

        html += '<div class="tb-card ' + (isSel ? 'tb-selected' : '') + '" id="tb-card-' + i + '">' +
            '<div class="tb-card-head">' +
            '<div class="tb-card-left">' +
            '<input type="checkbox" ' + (isSel ? 'checked' : '') + ' onchange="tbToggleSelect(' + i + ')" onclick="event.stopPropagation();">' +
            '<span class="tb-card-num">Q' + (i + 1) + '</span>' +
            '<span class="tb-spacing-tag">' + sp + 'px</span></div>' +
            '<div class="tb-card-btns">' +
            '<button onclick="tbMove(' + i + ',-1)"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>' +
            '<button onclick="tbMove(' + i + ',1)"' + (i === n - 1 ? ' disabled' : '') + '>&#9660;</button>' +
            '<button onclick="tbShowPreview(' + i + ')">Preview</button>' +
            '<button onclick="tbToggleEdit(' + i + ')">' + (isEdit ? 'Cancel' : 'Edit') + '</button>' +
            '<button class="del" onclick="tbDelete(' + i + ')">Delete</button></div></div>' +
            display + edit + '</div>';
    });
    list.innerHTML = html;

    // Re-instantiate variable editors for dynamic questions in edit mode
    TBState.questions.forEach(function(q, i) {
        if (TBState.editing.has(i) && q._dynamic && q.variableDescriptor) {
            var container = document.getElementById('tb-var-editor-' + i);
            if (container && typeof VariableEditor === 'function') {
                var editor = new VariableEditor(container, {
                    onChange: function() {
                        q.variableDescriptor = editor.getDescriptor();
                        q._descriptor = editor.getDescriptor();
                    }
                });
                editor.setFromDescriptor(q.variableDescriptor);
            }
        }
    });
}

// ===== ACTIONS =====
function tbToggleEdit(i) {
    TBState.editing.has(i) ? TBState.editing.delete(i) : TBState.editing.add(i);
    tbRender();
}

function tbApplyEdit(i) {
    var q = TBState.questions[i];
    q.text = document.getElementById('tb-etext-' + i).value.trim();
    if (!q.openEnded) {
        var radios = document.querySelectorAll('input[name="tb-c-' + i + '"]');
        var ci = 0;
        radios.forEach(function(r, j) { if (r.checked) ci = j; });
        q.options = [];
        for (var j = 0; j < 4; j++) { q.options.push(['A','B','C','D'][j] + ') ' + document.getElementById('tb-eo-' + i + '-' + j).value.trim()); }
        q.correct = q.options[ci].replace(/^[A-D]\)\s*/i, '').trim();
    } else {
        q.correct = document.getElementById('tb-ec-' + i).value.trim();
    }
    if (q._dynamic) tbToggleDynamic(i, true);
    TBState.editing.delete(i);
    tbRender();
}

function tbDelete(i) {
    if (!confirm('Delete Q' + (i + 1) + '?')) return;
    TBState.questions.splice(i, 1);
    TBState.editing.clear();
    TBState.selected.clear();
    tbRender();
}

function tbDeleteSelected() {
    if (!TBState.selected.size) return;
    if (!confirm('Delete ' + TBState.selected.size + ' selected questions?')) return;
    var keep = [];
    TBState.questions.forEach(function(q, i) { if (!TBState.selected.has(i)) keep.push(q); });
    TBState.questions.length = 0;
    keep.forEach(function(q) { TBState.questions.push(q); });
    TBState.editing.clear();
    TBState.selected.clear();
    tbRender();
    tbUpdateSelectBar();
}

function tbMove(i, d) {
    var j = i + d;
    if (j < 0 || j >= TBState.questions.length) return;
    var tmp = TBState.questions[i];
    TBState.questions[i] = TBState.questions[j];
    TBState.questions[j] = tmp;
    var nw = new Set();
    TBState.editing.forEach(function(x) { nw.add(x === i ? j : x === j ? i : x); });
    TBState.editing = nw;
    tbRender();
}

function tbAddBlankQuestion() {
    var i = TBState.questions.length;
    TBState.questions.push({ text: '', correct: '', options: ['','','',''], openEnded: false, guide: '', isCustom: true, render: null, _dynamic: false, _descriptor: null, _equation: null, _drawingDataUrl: null });
    TBState.editing.add(i);
    tbRender();
    var card = document.getElementById('tb-card-' + i);
    if (card) card.scrollIntoView({ behavior: 'smooth' });
}

// ===== DYNAMIC =====
function tbToggleDynamic(i, on) {
    var q = TBState.questions[i];
    q._dynamic = on;
    q._descriptor = null;
    if (on && typeof extractNumbers === 'function') {
        var an = parseFloat((q.correct || '').replace(/[,$%]/g, ''));
        if (!isNaN(an)) {
            var ns = extractNumbers(q.text);
            if (ns.length >= 2) {
                var op = detectOperation(ns, an);
                if (op) { q._descriptor = buildDescriptor(q.text, ns, op, an); tbRender(); return; }
            }
        }
        if (typeof buildCosmeticDescriptor === 'function') {
            var c = buildCosmeticDescriptor(q.text, q.correct, q.options || []);
            if (c) { q._descriptor = c; tbRender(); return; }
        }
        q._dynamic = false;
    }
    tbRender();
}

function tbMakeDynamic(i) {
    var q = TBState.questions[i];
    // Ensure edit mode is open
    var needsRender = !TBState.editing.has(i);
    if (needsRender) {
        TBState.editing.add(i);
    }

    // Use autoDetectVariables if available
    var desc = null;
    if (typeof autoDetectVariables === 'function') {
        desc = autoDetectVariables(q.text, q.correct, q.options || [], q.guide || '');
    }
    if (!desc) {
        // Fallback to existing logic
        if (typeof extractNumbers === 'function') {
            var an = parseFloat((q.correct || '').replace(/[,$%]/g, ''));
            if (!isNaN(an)) {
                var ns = extractNumbers(q.text);
                if (ns.length >= 2) {
                    var op = detectOperation(ns, an);
                    if (op) desc = buildDescriptor(q.text, ns, op, an);
                }
            }
        }
        if (!desc && typeof buildCosmeticDescriptor === 'function') {
            desc = buildCosmeticDescriptor(q.text, q.correct, q.options || []);
        }
    }

    q._dynamic = true;
    if (desc) {
        q._descriptor = desc;
    }

    // Render first if needed, then create the editor in the container
    if (needsRender) {
        tbRender();
    }

    // Show variable editor
    var container = document.getElementById('tb-var-editor-' + i);
    if (container && typeof VariableEditor === 'function') {
        container.innerHTML = '';
        var editor = new VariableEditor(container, {
            onChange: function() {
                q.variableDescriptor = editor.getDescriptor();
                q._descriptor = editor.getDescriptor();
            }
        });
        editor.loadQuestion(q.text, q.correct, q.options || [], q.guide || '');
        if (desc) {
            editor.setFromDescriptor(desc);
        }
        q.variableDescriptor = editor.getDescriptor();
        q._descriptor = q.variableDescriptor;
    } else {
        if (!desc) {
            alert('Could not detect variables for this question.');
            q._dynamic = false;
        }
        tbRender();
    }
}

function tbMakeAllDynamic() {
    if (!TBState.questions.length) return;
    var ok = 0, fail = [];
    TBState.questions.forEach(function(q, i) {
        if (q._dynamic && q._descriptor) { ok++; return; }
        q._dynamic = true; q._descriptor = null;
        if (typeof extractNumbers === 'function') {
            var an = parseFloat((q.correct || '').replace(/[,$%]/g, ''));
            if (!isNaN(an)) {
                var ns = extractNumbers(q.text);
                if (ns.length >= 2) {
                    var op = detectOperation(ns, an);
                    if (op) { q._descriptor = buildDescriptor(q.text, ns, op, an); ok++; return; }
                }
            }
            if (typeof buildCosmeticDescriptor === 'function') {
                var c = buildCosmeticDescriptor(q.text, q.correct, q.options || []);
                if (c) { q._descriptor = c; ok++; return; }
            }
        }
        q._dynamic = false;
        fail.push(i + 1);
    });
    tbRender();
    var s = document.getElementById('saved-status');
    if (fail.length === 0) {
        s.textContent = 'All ' + TBState.questions.length + ' made dynamic';
        s.className = 'tb-status ok';
    } else {
        s.innerHTML = ok + '/' + TBState.questions.length + ' dynamic -- <strong>Q' + fail.join(', Q') + '</strong> could not convert';
        s.className = 'tb-status err';
    }
}

function tbMakeAllStatic() {
    TBState.questions.forEach(function(q) { q._dynamic = false; q._descriptor = null; });
    tbRender();
    document.getElementById('saved-status').textContent = 'All static';
    document.getElementById('saved-status').className = 'tb-status ok';
}

// ===== EQUATION =====
function tbPreviewEq(i) {
    var v = document.getElementById('tb-eq-' + i).value.trim();
    if (v) TBState.questions[i]._equation = v;
}

// ===== DRAWING =====
function tbOpenDrawing(i) {
    TBState.drawTarget = i;
    document.getElementById('tb-draw-modal').classList.add('active');
    var c = document.getElementById('tb-draw-canvas'), ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    if (TBState.questions[i]._drawingDataUrl) {
        var img = new Image();
        img.onload = function() { ctx.drawImage(img, 0, 0, c.width, c.height); };
        img.src = TBState.questions[i]._drawingDataUrl;
    }
    initDrawEvents();
}

function tbCloseDrawing() {
    document.getElementById('tb-draw-modal').classList.remove('active');
    TBState.drawTarget = null;
}

function tbSaveDrawing() {
    if (TBState.drawTarget === null) return;
    TBState.questions[TBState.drawTarget]._drawingDataUrl = document.getElementById('tb-draw-canvas').toDataURL('image/jpeg', 0.6);
    tbCloseDrawing();
    tbRender();
}

function tbSetTool(t, b) {
    TBState.drawTool = t;
    document.querySelectorAll('#tb-draw-tools button').forEach(function(x) {
        if (x.textContent === 'Pen' || x.textContent === 'Eraser') x.classList.remove('active');
    });
    b.classList.add('active');
}

function tbSetColor(c, e) {
    TBState.drawColor = c;
    document.querySelectorAll('.tb-color-dot').forEach(function(x) { x.classList.remove('active'); });
    e.classList.add('active');
}

function tbSetWidth(w, b) {
    TBState.drawWidth = w;
    document.querySelectorAll('#tb-draw-tools button').forEach(function(x) {
        if (['Thin','Med','Thick'].indexOf(x.textContent) !== -1) x.classList.remove('active');
    });
    b.classList.add('active');
}

function tbClearCanvas() {
    var c = document.getElementById('tb-draw-canvas');
    c.getContext('2d').fillStyle = '#fff';
    c.getContext('2d').fillRect(0, 0, c.width, c.height);
}

function tbDrawGrid() {
    var c = document.getElementById('tb-draw-canvas'), ctx = c.getContext('2d');
    drawCartesianGrid(ctx, c.width, c.height, 30);
    ctx.strokeStyle = '#495057'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(c.width / 2, 0); ctx.lineTo(c.width / 2, c.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, c.height / 2); ctx.lineTo(c.width, c.height / 2); ctx.stroke();
}

function initDrawEvents() {
    if (TBState.drawListenersAttached) return;
    TBState.drawListenersAttached = true;
    var c = document.getElementById('tb-draw-canvas');

    function gp(e) {
        var r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
        return e.touches
            ? { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
            : { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }
    function s(e) {
        e.preventDefault(); TBState.drawing = true;
        var p = gp(e), ctx = c.getContext('2d');
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function m(e) {
        if (!TBState.drawing) return;
        e.preventDefault();
        var p = gp(e), ctx = c.getContext('2d');
        ctx.strokeStyle = TBState.drawTool === 'eraser' ? '#fff' : TBState.drawColor;
        ctx.lineWidth = TBState.drawTool === 'eraser' ? 20 : TBState.drawWidth;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function en() { TBState.drawing = false; }

    c.addEventListener('mousedown', s);
    c.addEventListener('mousemove', m);
    c.addEventListener('mouseup', en);
    c.addEventListener('mouseleave', en);
    c.addEventListener('touchstart', s, { passive: false });
    c.addEventListener('touchmove', m, { passive: false });
    c.addEventListener('touchend', en);
}

// ===== SELECTION & SPACING =====
function tbToggleSelect(i) {
    TBState.selected.has(i) ? TBState.selected.delete(i) : TBState.selected.add(i);
    tbUpdateSelectBar();
    tbRender();
}

function tbSelectAll() {
    TBState.questions.forEach(function(_, i) { TBState.selected.add(i); });
    tbUpdateSelectBar();
    tbRender();
}

function tbClearSelection() {
    TBState.selected.clear();
    tbUpdateSelectBar();
    tbRender();
}

function tbSpaceSelected(d) {
    TBState.selected.forEach(function(i) {
        if (TBState.questions[i]) TBState.questions[i]._spacing = Math.max(0, (TBState.questions[i]._spacing || 16) + d);
    });
    tbRender();
}

function tbResetSpacing() {
    TBState.selected.forEach(function(i) {
        if (TBState.questions[i]) delete TBState.questions[i]._spacing;
    });
    tbRender();
}

function tbGlobalSpace(d) {
    TBState.questions.forEach(function(q) { q._spacing = Math.max(0, (q._spacing || 16) + d); });
    tbRender();
}

function tbUpdateSelectBar() {
    var b = document.getElementById('tb-select-bar'), n = TBState.selected.size;
    b.classList.toggle('visible', n > 0);
    document.getElementById('tb-select-count').textContent = n + ' selected';
}

// ===== ASSIGN =====
function tbUpdateAssignTarget() {
    var v = document.getElementById('tb-assign-by').value;
    document.getElementById('tb-grade-row').style.display = v === 'grade' ? '' : 'none';
    document.getElementById('tb-class-row').style.display = v === 'class' ? '' : 'none';
    document.getElementById('tb-student-row').style.display = v === 'student' ? '' : 'none';
}

// ===== SAVE TEST =====
async function tbSaveTest() {
    if (!TBState.questions.length) return;
    var name = document.getElementById('tb-name').value.trim() || 'Custom Test';
    var st = document.getElementById('tb-save-status');
    st.textContent = 'Saving...'; st.style.color = 'var(--text-secondary)';

    var testId = TBState.currentTestId || ('custom_' + Date.now());
    TBState.currentTestId = testId;
    var dynQs = TBState.questions.filter(function(q) { return q._dynamic && q._descriptor; });
    var statQs = TBState.questions.filter(function(q) { return !q._dynamic || !q._descriptor; });
    var clean = statQs.map(function(q) {
        return { text: q.text, correct: q.correct, options: q.options || [], openEnded: q.openEnded || false, guide: q.guide || '', isCustom: true, _equation: q._equation || null, _drawingDataUrl: q._drawingDataUrl || null, visualHTML: q.visualHTML || '', optionVisuals: q.optionVisuals || null, answerVisual: q.answerVisual || null };
    });
    var td = dynQs.length > 0
        ? { id: testId, name: name, dynamic: true, descriptors: dynQs.map(function(q) { return q._descriptor; }), staticQuestions: clean, createdAt: new Date().toLocaleDateString() }
        : { id: testId, name: name, createdAt: new Date().toLocaleDateString(), questions: clean };

    // Attach metadata
    var _cat = document.getElementById('tb-category'); if (_cat && _cat.value.trim()) td.category = _cat.value.trim();
    var _grd = document.getElementById('tb-test-grade'); if (_grd && _grd.value.trim()) td.testGrade = _grd.value.trim();
    var _cls = document.getElementById('tb-test-class'); if (_cls && _cls.value.trim()) td.testClass = _cls.value.trim();
    var _chp = document.getElementById('tb-test-chapter'); if (_chp && _chp.value.trim()) td.chapter = _chp.value.trim();

    try {
        var retries = 0;
        while (typeof fbSaveCustomTest !== 'function' && retries++ < 20) await new Promise(function(r) { setTimeout(r, 150); });
        if (typeof fbSaveCustomTest === 'function') await fbSaveCustomTest(testId, td);
        var t = JSON.parse(localStorage.getItem('mathsite_custom_tests') || '{}');
        t[testId] = td; localStorage.setItem('mathsite_custom_tests', JSON.stringify(t));
    } catch(e) { console.error('Save test error:', e); }

    var by = document.getElementById('tb-assign-by').value;
    var tk;
    if (by === 'class') tk = 'class:' + document.getElementById('tb-target-class').value;
    else if (by === 'student') tk = 'student:' + document.getElementById('tb-target-student').value.trim().toLowerCase();
    else tk = 'grade:' + document.getElementById('tb-target-grade').value;
    var item = { type: 'custom', testId: testId, name: name, redemption: document.getElementById('tb-redemption').checked, assignedAt: new Date().toLocaleDateString() };
    var due = document.getElementById('tb-due').value, timer = parseInt(document.getElementById('tb-timer').value);
    if (due) item.dueDate = due;
    if (timer > 0) item.timerMinutes = timer;

    try {
        var retries2 = 0;
        while (typeof fbGetAssignments !== 'function' && retries2++ < 20) await new Promise(function(r) { setTimeout(r, 150); });
        var a = {};
        if (typeof fbGetAssignments === 'function') a = await fbGetAssignments();
        else a = JSON.parse(localStorage.getItem('mathsite_assignments') || '{}');
        if (!a[tk]) a[tk] = [];
        a[tk] = a[tk].filter(function(x) { return x.testId !== testId; });
        a[tk].push(item);
        localStorage.setItem('mathsite_assignments', JSON.stringify(a));
        if (typeof fbSaveAssignments === 'function') await fbSaveAssignments(a);
    } catch(e) { console.error('Save assignment error:', e); }

    st.innerHTML = '<span style="color:var(--correct);font-weight:600;">"' + name + '" saved & assigned!</span>';
    tbSaveToRecent();
}

async function tbSaveTestOnly() {
    if (!TBState.questions.length) return;
    var name = document.getElementById('tb-name').value.trim() || 'Custom Test';
    var st = document.getElementById('tb-save-status');
    st.textContent = 'Saving...'; st.style.color = 'var(--text-secondary)';

    var testId = TBState.currentTestId || ('custom_' + Date.now());
    TBState.currentTestId = testId;
    var dynQs = TBState.questions.filter(function(q) { return q._dynamic && q._descriptor; });
    var statQs = TBState.questions.filter(function(q) { return !q._dynamic || !q._descriptor; });
    var clean = statQs.map(function(q) {
        return { text: q.text, correct: q.correct, options: q.options || [], openEnded: q.openEnded || false, guide: q.guide || '', isCustom: true, _equation: q._equation || null, _drawingDataUrl: q._drawingDataUrl || null, visualHTML: q.visualHTML || '', optionVisuals: q.optionVisuals || null, answerVisual: q.answerVisual || null };
    });
    var td = dynQs.length > 0
        ? { id: testId, name: name, dynamic: true, descriptors: dynQs.map(function(q) { return q._descriptor; }), staticQuestions: clean, createdAt: new Date().toLocaleDateString() }
        : { id: testId, name: name, createdAt: new Date().toLocaleDateString(), questions: clean };

    // Attach metadata
    var _cat = document.getElementById('tb-category'); if (_cat && _cat.value.trim()) td.category = _cat.value.trim();
    var _grd = document.getElementById('tb-test-grade'); if (_grd && _grd.value.trim()) td.testGrade = _grd.value.trim();
    var _cls = document.getElementById('tb-test-class'); if (_cls && _cls.value.trim()) td.testClass = _cls.value.trim();
    var _chp = document.getElementById('tb-test-chapter'); if (_chp && _chp.value.trim()) td.chapter = _chp.value.trim();

    try {
        var retries = 0;
        while (typeof fbSaveCustomTest !== 'function' && retries++ < 20) await new Promise(function(r) { setTimeout(r, 150); });
        if (typeof fbSaveCustomTest === 'function') await fbSaveCustomTest(testId, td);
        var t = JSON.parse(localStorage.getItem('mathsite_custom_tests') || '{}');
        t[testId] = td; localStorage.setItem('mathsite_custom_tests', JSON.stringify(t));
        st.innerHTML = '<span style="color:var(--correct);font-weight:600;">"' + name + '" saved! Assign it from Admin &rarr; Assign Test.</span>';
    } catch(e) {
        st.textContent = 'Save error: ' + e.message; st.style.color = 'var(--incorrect)';
    }
    tbSaveToRecent();
}

async function tbLoadSavedTest() {
    var retries = 0;
    while (typeof fbGetCustomTests !== 'function' && retries++ < 20) await new Promise(function(r) { setTimeout(r, 150); });
    if (typeof fbGetCustomTests !== 'function') { alert('Firebase not ready.'); return; }
    var all = await fbGetCustomTests();
    var entries = Object.entries(all);
    if (!entries.length) { alert('No saved tests found.'); return; }
    var names = entries.map(function(pair, i) { var id = pair[0], t = pair[1]; return (i + 1) + '. ' + t.name + ' (' + ((t.questions || t.staticQuestions || []).length) + 'Q) -- ' + (t.createdAt || ''); }).join('\n');
    var pick = prompt('Select a test to load:\n\n' + names + '\n\nEnter the number:');
    var idx = parseInt(pick) - 1;
    if (isNaN(idx) || idx < 0 || idx >= entries.length) return;
    var testId = entries[idx][0], testData = entries[idx][1];
    TBState.currentTestId = testId;
    document.getElementById('tb-name').value = testData.name || '';
    var _catEl = document.getElementById('tb-category'); if (_catEl) _catEl.value = testData.category || '';
    var _grdEl = document.getElementById('tb-test-grade'); if (_grdEl) _grdEl.value = testData.testGrade || '';
    var _clsEl = document.getElementById('tb-test-class'); if (_clsEl) _clsEl.value = testData.testClass || '';
    var _chpEl = document.getElementById('tb-test-chapter'); if (_chpEl) _chpEl.value = testData.chapter || '';
    TBState.questions.length = 0;
    TBState.editing.clear(); TBState.selected.clear();
    var qs = testData.questions || testData.staticQuestions || [];
    qs.forEach(function(q) { TBState.questions.push({ text: q.text, correct: q.correct, options: q.options, openEnded: q.openEnded, guide: q.guide, isCustom: q.isCustom, _dynamic: false, _descriptor: null, _equation: q._equation || null, _drawingDataUrl: q._drawingDataUrl || null, visualHTML: q.visualHTML, optionVisuals: q.optionVisuals, answerVisual: q.answerVisual }); });
    tbRender();
    document.getElementById('saved-status').textContent = 'Loaded "' + testData.name + '"';
    document.getElementById('saved-status').className = 'tb-status ok';
}

// ===== CONSTRUCT ITEM =====
function tbConstructItem(template, difficulty) {
    var origRand = window.rand;
    if (difficulty && difficulty !== 'normal') {
        window.rand = function(a, b) {
            var r = b - a;
            if (difficulty === 'easy') { var nb = a + Math.max(1, Math.floor(r * 0.4)); return Math.floor(Math.random() * (nb - a + 1)) + a; }
            if (difficulty === 'hard') { var na = a + Math.floor(r * 0.5); return Math.floor(Math.random() * (b - na + 1)) + na; }
            return Math.floor(Math.random() * (b - a + 1)) + a;
        };
    }
    var raw;
    try { raw = template.gen(); } finally { window.rand = origRand; }
    var item = { text: raw.q, correct: String(raw.ans), guide: raw.guide || '', render: raw.render || null, openEnded: template.openEnded || false, isCustom: true, _dynamic: false, _descriptor: null, _equation: null, _drawingDataUrl: null, _skillType: template.type, visualHTML: raw.visualHTML || '', answerVisual: raw.answerVisual || null, optionVisuals: null };
    if (!template.openEnded && raw.distractors) {
        var all = [String(raw.ans)].concat(raw.distractors.map(String));
        var u = []; var seen = {};
        all.forEach(function(x) { if (!seen[x]) { seen[x] = true; u.push(x); } });
        u.sort(function() { return Math.random() - 0.5; });
        u = u.slice(0, 4);
        item.options = u.map(function(c, i) { return String.fromCharCode(65 + i) + ') ' + c; });
        item.correct = String(raw.ans);
        // Remap option visuals from text-keyed to letter-keyed after shuffle
        if (raw.optionVisualsByText) {
            var ov = {};
            u.forEach(function(c, i) {
                var letter = String.fromCharCode(65 + i);
                if (raw.optionVisualsByText[c]) ov[letter] = raw.optionVisualsByText[c];
            });
            if (Object.keys(ov).length) item.optionVisuals = ov;
        }
    }
    return item;
}

// ===== SKILL GENERATOR =====
function tbGetPool(grade) {
    if (typeof extraTemplates === 'undefined') return [];
    if (grade === 'algebra1') return (extraTemplates.keystone || {}).algebra1 || [];
    if (grade === 'all') {
        var a = [];
        for (var g in (extraTemplates.pssa || {})) a = a.concat(extraTemplates.pssa[g].map(function(t) { return Object.assign({}, t, { _grade: g }); }));
        for (var s in (extraTemplates.keystone || {})) a = a.concat(extraTemplates.keystone[s].map(function(t) { return Object.assign({}, t, { _grade: 'K' }); }));
        return a;
    }
    return (extraTemplates.pssa || {})[grade] || [];
}

var GL = { '3':'G3', '4':'G4', '5':'G5', '6':'G6', '7':'G7', '8':'G8', 'K':'Alg', 'algebra1':'Alg' };

function tbPopulateSkills() {
    var grade = document.getElementById('gen-grade').value, pool = tbGetPool(grade), tm = {};
    pool.forEach(function(t) {
        if (!tm[t.type]) tm[t.type] = { type: t.type, anchor: t.anchor || '', count: 0, templates: [], grades: new Set() };
        tm[t.type].count++;
        tm[t.type].templates.push(t);
        tm[t.type].grades.add(t._grade || grade);
    });
    TBState.skillData = Object.values(tm).sort(function(a, b) { return skillName(a.type).localeCompare(skillName(b.type)); });
    tbRenderSkillList();
}

function tbRenderSkillList() {
    var c = document.getElementById('gen-skill-list');
    var search = (document.getElementById('gen-search').value || '').toLowerCase();
    var qty = parseInt(document.getElementById('gen-qty').value) || 5;
    var grade = document.getElementById('gen-grade').value;
    var data = TBState.skillData;
    if (search && grade !== 'all') {
        var ap = tbGetPool('all'), am = {};
        ap.forEach(function(t) {
            if (!am[t.type]) am[t.type] = { type: t.type, anchor: t.anchor || '', count: 0, templates: [], grades: new Set() };
            am[t.type].count++;
            am[t.type].templates.push(t);
            am[t.type].grades.add(t._grade || 'all');
        });
        data = Object.values(am).sort(function(a, b) { return skillName(a.type).localeCompare(skillName(b.type)); });
    }
    var f = search ? data.filter(function(s) {
        var d = skillName(s.type).toLowerCase();
        return d.indexOf(search) !== -1 || s.type.toLowerCase().indexOf(search) !== -1 || s.anchor.toLowerCase().indexOf(search) !== -1;
    }) : data;
    if (!f.length) { c.innerHTML = '<div class="tb-empty" style="padding:0.75rem;">No skills found.</div>'; return; }
    var h = '';
    f.forEach(function(s, idx) {
        var safe = s.type.replace(/'/g, "\\'"), dn = skillName(s.type);
        var gt = s.grades && s.grades.size > 0 && grade === 'all' ? '<span class="tb-skill-grade">' + Array.from(s.grades).map(function(g) { return GL[g] || g; }).join('/') + '</span>' : '';
        h += '<div class="tb-skill-row" onclick="tbToggleSkillOpts(' + idx + ')">' +
            '<input type="checkbox" class="gen-chk" value="' + s.type + '" onclick="event.stopPropagation();">' +
            '<span class="tb-skill-name">' + dn + '</span>' + gt +
            '<span class="tb-skill-count">(' + s.count + ')</span>' +
            '<button class="tb-skill-add" onclick="event.stopPropagation();tbQuickAdd(\'' + safe + '\',' + idx + ')">+' + qty + '</button></div>' +
            '<div class="tb-skill-opts" id="so-' + idx + '">' +
            '<label style="font-weight:600;color:var(--text-secondary);">Diff:</label>' +
            '<select id="sd-' + idx + '"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option></select>' +
            '<label style="font-weight:600;color:var(--text-secondary);">Qty:</label>' +
            '<input type="number" id="sq-' + idx + '" value="' + qty + '" min="1" max="50">' +
            '<button class="tb-skill-add" onclick="tbQuickAdd(\'' + safe + '\',' + idx + ')" style="padding:0.2rem 0.5rem;">Go</button></div>';
    });
    c.innerHTML = h;
}

function tbToggleSkillOpts(i) {
    var e = document.getElementById('so-' + i);
    if (e) e.classList.toggle('open');
}

function tbFilterSkills() { tbRenderSkillList(); }

function tbGenerateSelected() {
    var cks = document.querySelectorAll('.gen-chk:checked');
    if (!cks.length) { document.getElementById('saved-status').textContent = 'Select skills first'; document.getElementById('saved-status').className = 'tb-status err'; return; }
    var gq = parseInt(document.getElementById('gen-qty').value) || 5;
    var tot = 0;
    cks.forEach(function(cb) {
        var sk = TBState.skillData.find(function(s) { return s.type === cb.value; });
        if (!sk) return;
        var idx = TBState.skillData.indexOf(sk);
        var de = document.getElementById('sd-' + idx), qe = document.getElementById('sq-' + idx);
        var diff = de ? de.value : 'normal', qty = qe ? parseInt(qe.value) || gq : gq;
        for (var i = 0; i < qty; i++) {
            try { var it = tbConstructItem(sk.templates[i % sk.templates.length], diff); it._lastDifficulty = diff; TBState.questions.push(it); tot++; } catch(e) {}
        }
    });
    tbRender();
    document.getElementById('saved-status').textContent = tot + ' questions from ' + cks.length + ' skills';
    document.getElementById('saved-status').className = 'tb-status ok';
}

function tbGenerateAll() {
    if (!TBState.skillData.length) tbPopulateSkills();
    var t = 0;
    TBState.skillData.forEach(function(s) {
        try { var it = tbConstructItem(s.templates[Math.floor(Math.random() * s.templates.length)], 'normal'); it._lastDifficulty = 'normal'; TBState.questions.push(it); t++; } catch(e) {}
    });
    tbRender();
    document.getElementById('saved-status').textContent = t + ' questions (1 per skill)';
    document.getElementById('saved-status').className = 'tb-status ok';
}

function tbQuickAdd(type, idx) {
    var sk = TBState.skillData.find(function(s) { return s.type === type; });
    if (!sk) return;
    var de = document.getElementById('sd-' + idx), qe = document.getElementById('sq-' + idx);
    var diff = de ? de.value : 'normal', qty = qe ? parseInt(qe.value) || 5 : 5;
    for (var i = 0; i < qty; i++) {
        try { var it = tbConstructItem(sk.templates[i % sk.templates.length], diff); it._lastDifficulty = diff; TBState.questions.push(it); } catch(e) {}
    }
    tbRender();
    document.getElementById('saved-status').textContent = '+' + qty + ' ' + skillName(type) + ' (' + diff + ')';
    document.getElementById('saved-status').className = 'tb-status ok';
}

// ===== EXPORT SETTINGS =====
function getExpSettings() {
    var g = function(id) { return document.getElementById(id) || {}; };
    return {
        columns: parseInt(g('exp-columns').value) || 1,
        fontSize: g('exp-font-size').value || '14px',
        spacing: g('exp-spacing').value || 'normal',
        workHeight: g('exp-work-height').value || '80px',
        margins: g('exp-margins').value || 'normal',
        numbering: g('exp-numbering').value || '123',
        instructions: (g('exp-instructions').value || '').trim(),
        shuffleProblems: !!g('exp-shuffle-problems').checked,
        shuffleChoices: !!g('exp-shuffle-choices').checked,
        answerLines: !!g('exp-answer-lines').checked,
        showNumbers: g('exp-show-numbers').checked !== false,
        showName: g('exp-show-name').checked !== false,
        showDate: g('exp-show-date').checked !== false,
        showPeriod: g('exp-show-period').checked !== false,
        includeKey: g('exp-include-key').checked !== false,
        includeSolutions: g('exp-include-solutions').checked !== false,
        versionCount: parseInt(g('exp-version-count').value) || 1,
        versionDiff: g('exp-version-diff').value || 'both'
    };
}

function fmtNum(i, s) {
    if (s === 'none') return '';
    if (s === 'abc') return String.fromCharCode(97 + i) + ')';
    if (s === 'roman') { var r = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']; return (r[i] || (i + 1)) + '.'; }
    return (i + 1) + '.';
}

function shufArr(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = b[i]; b[i] = b[j]; b[j] = tmp; } return b; }

function shufOpts(opts) {
    if (!opts || !opts.length) return opts;
    var cl = opts.map(function(o) { return o.replace(/^[A-E]\)\s*/i, '').trim(); });
    var sh = shufArr(cl);
    return sh.map(function(c, i) { return ['A','B','C','D'][i] + ') ' + c; });
}

function buildStyles(s) {
    var mm = { narrow: '1.5cm', normal: '2cm', wide: '2.5cm' };
    var sm = { compact: 8, normal: 16, spacious: 24, extra: 40 };
    return "body{font-family:'Segoe UI',sans-serif;margin:" + (mm[s.margins] || '2cm') + ";color:#212529;font-size:" + (s.fontSize || '14px') + ";line-height:1.6;" + (s.columns > 1 ? 'column-count:' + s.columns + ';column-gap:2rem;' : '') + "}" +
        "h1{font-size:1.4em;margin-bottom:0.25rem;color:#2563eb;}" +
        ".instr{color:#444;font-size:0.9em;margin-bottom:0.75rem;padding:0.4rem 0.6rem;border:1px solid #ddd;border-radius:4px;background:#f9f9f9;}" +
        ".nl{color:#999;margin-bottom:1rem;border-bottom:1px solid #ccc;padding-bottom:0.75rem;}" +
        ".q{margin-bottom:" + (sm[s.spacing] || 16) + "px;page-break-inside:avoid;break-inside:avoid;}" +
        ".qn{font-weight:700;display:inline;}.qt{display:inline;}" +
        ".os{display:grid;grid-template-columns:1fr 1fr;gap:0.2rem 1.5rem;margin:0.3rem 0 0 1.5rem;}.op{padding:0.15rem 0;}" +
        ".al{border-bottom:1px solid #999;height:1.5rem;margin:0.3rem 0 0 1.5rem;width:60%;}" +
        ".wk{border:1px solid #e0e0e0;border-radius:4px;margin:0.4rem 0 0 1.5rem;}" +
        ".mfrac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:0.85em;line-height:1.15;margin:0 0.15em;}" +
        ".mfrac-num{border-bottom:1.5px solid currentColor;padding:0 0.25em 0.1em;}.mfrac-den{padding:0.1em 0.25em 0;}" +
        ".msqrt{display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 0.1em;}.msqrt::before{content:'\\221A';font-size:1.2em;line-height:0.9;}.msqrt-inner{border-top:2px solid currentColor;padding:0 0.2em 0 0.08em;margin-left:-0.05em;line-height:1.3;}" +
        ".kq{margin-bottom:0.3rem;}.kg{font-size:0.85em;color:#555;margin:0.1rem 0 0.6rem 1.5rem;padding:0.3rem 0.5rem;background:#f8f9fa;border-left:3px solid #2563eb;border-radius:0 4px 4px 0;}" +
        "@media print{body{margin:1.5cm;}.np{display:none;}}";
}

// ===== EXPORT PDF =====
function tbExportPDF() {
    if (!TBState.questions.length) return;
    var s = getExpSettings();
    var title = document.getElementById('tb-name').value.trim() || 'Test';
    var rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : function(x) { return x; };

    var meta = TBState.questions.map(function(q) {
        if (q._skillType) {
            var p = [];
            TBState.skillData.forEach(function(sk) { if (sk.type === q._skillType) p = p.concat(sk.templates); });
            if (!p.length) tbGetPool('all').filter(function(t) { return t.type === q._skillType; }).forEach(function(t) { p.push(t); });
            return { has: p.length > 0, tpls: p, orig: q };
        }
        return { has: false, orig: q };
    });

    var nv = s.versionCount || 1;
    var win = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><title>' + title + '</title><style>' + buildStyles(s) + '</style></head><body>';

    for (var v = 0; v < nv; v++) {
        var qs;
        if (v === 0) {
            qs = s.shuffleProblems ? shufArr(TBState.questions) : TBState.questions.slice();
        } else {
            qs = meta.map(function(m) {
                if ((s.versionDiff === 'numbers' || s.versionDiff === 'both') && m.has) {
                    var t = m.tpls[Math.floor(Math.random() * m.tpls.length)];
                    return tbConstructItem(t, m.orig._lastDifficulty || 'normal');
                }
                return Object.assign({}, m.orig);
            });
            if (s.versionDiff === 'order' || s.versionDiff === 'both') qs = shufArr(qs);
        }
        if (v > 0) html += '<div style="page-break-before:always;"></div>';
        var vl = nv > 1 ? 'Version ' + String.fromCharCode(65 + v) : '';
        html += '<h1>' + title + (vl ? ' -- ' + vl : '') + '</h1>';
        if (s.instructions) html += '<div class="instr">' + s.instructions + '</div>';
        var lines = [];
        if (s.showName) lines.push('Name: ___________________________________');
        if (s.showDate) lines.push('Date: ______________');
        if (s.showPeriod) lines.push('Period: ________');
        if (lines.length) html += '<div class="nl">' + lines.join('&emsp;&emsp;') + '</div>';
        qs.forEach(function(q, i) {
            var sp = q._spacing || { compact: 8, normal: 16, spacious: 24, extra: 40 }[s.spacing] || 16;
            var num = s.showNumbers ? fmtNum(i, s.numbering) : '';
            var ops = s.shuffleChoices ? shufOpts(q.options) : (q.options || []);
            html += '<div class="q" style="margin-bottom:' + sp + 'px;"><span class="qn">' + num + '</span> <span class="qt">' + rm(q.text) + '</span>';
            if (ops.length) {
                html += '<div class="os">';
                ops.forEach(function(o) { html += '<div class="op">' + rm(o) + '</div>'; });
                html += '</div>';
            }
            if (s.answerLines) html += '<div class="al"></div>';
            if (s.workHeight && s.workHeight !== '0') html += '<div class="wk" style="height:' + s.workHeight + ';"></div>';
            html += '</div>';
        });
        if (s.includeKey) {
            html += '<div style="page-break-before:always;"><h1>Answer Key' + (vl ? ' -- ' + vl : '') + '</h1><hr style="border-color:#2563eb;margin-bottom:1rem;">';
            qs.forEach(function(q, i) {
                var num = s.showNumbers ? fmtNum(i, s.numbering) : (i + 1) + '.';
                html += '<div class="kq"><strong>' + num + '</strong> ' + rm(q.correct) + '</div>';
                if (s.includeSolutions && q.guide) html += '<div class="kg">' + rm(q.guide) + '</div>';
            });
            html += '</div>';
        }
    }
    html += '<div class="np" style="position:fixed;top:1rem;right:1rem;"><button onclick="window.print()" style="padding:0.5rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">Print / Save PDF</button></div></body></html>';
    win.document.write(html);
    win.document.close();
}

function tbExportVariants() {
    var e = document.getElementById('exp-version-count');
    if (e) e.value = '3';
    tbExportPDF();
}

function tbExportDOCX() {
    if (!TBState.questions.length) return;
    if (typeof docx === 'undefined') { alert('DOCX library not loaded.'); return; }
    var name = document.getElementById('tb-name').value.trim() || 'Test';
    var ch = [
        new docx.Paragraph({ text: name, heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: 'Name: ___________________________________ Date: ______________ Period: ________', spacing: { after: 300 } })
    ];
    TBState.questions.forEach(function(q, i) {
        ch.push(new docx.Paragraph({ children: [new docx.TextRun({ text: (i + 1) + '. ' + q.text.replace(/<[^>]*>/g, ''), bold: true })], spacing: { before: 200 } }));
        if (q.options) q.options.forEach(function(o) { ch.push(new docx.Paragraph({ text: '    ' + o.replace(/<[^>]*>/g, ''), spacing: { before: 40 } })); });
        ch.push(new docx.Paragraph({ text: '', spacing: { before: 100, after: 200 } }));
    });
    ch.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '', break: 1 })], pageBreakBefore: true }));
    ch.push(new docx.Paragraph({ text: 'Answer Key -- ' + name, heading: docx.HeadingLevel.HEADING_1 }));
    TBState.questions.forEach(function(q, i) {
        ch.push(new docx.Paragraph({ children: [new docx.TextRun({ text: (i + 1) + '. ', bold: true }), new docx.TextRun({ text: q.correct.replace(/<[^>]*>/g, '') })], spacing: { before: 100 } }));
        if (q.guide) ch.push(new docx.Paragraph({ text: '    ' + q.guide.replace(/<[^>]*>/g, ''), spacing: { before: 40 }, indent: { left: 400 } }));
    });
    var d = new docx.Document({ sections: [{ children: ch }] });
    docx.Packer.toBlob(d).then(function(b) { saveAs(b, name.replace(/[^a-z0-9]/gi, '_') + '.docx'); });
}

// ===== PREVIEW =====
function tbShowPreview(i) {
    var q = TBState.questions[i];
    if (!q) return;
    var rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : function(x) { return x; };
    var p = document.getElementById('tb-preview'), c = document.getElementById('tb-preview-content');
    var h = '';
    if (q.visualHTML) h += '<div style="margin-bottom:0.5rem;max-width:100%;overflow:hidden;text-align:center;">' + q.visualHTML + '</div>';
    h += '<div style="font-size:0.95rem;line-height:1.5;margin-bottom:0.4rem;">' + rm(q.text || '') + '</div>';
    if (q.options && q.options.length) {
        h += '<div class="tb-preview-opts">';
        q.options.forEach(function(o) {
            var letter = (o.match(/^([A-D])/) || [])[1];
            var l = o.replace(/^[A-D]\)\s*/i, '').trim();
            var ok = l === q.correct || o.indexOf(q.correct) !== -1;
            var optVis = letter && q.optionVisuals && q.optionVisuals[letter];
            h += '<div class="tb-preview-opt ' + (ok ? 'correct' : '') + '">' + rm(o) + (optVis && optVis.visualHTML ? '<div style="margin-top:0.2rem;max-width:100%;overflow:hidden;">' + optVis.visualHTML + '</div>' : '') + '</div>';
        });
        h += '</div>';
    }
    if (q.openEnded && q.answerVisual && q.answerVisual.visualHTML) {
        h += '<div style="margin:0.3rem 0;max-width:100%;overflow:hidden;">' + q.answerVisual.visualHTML + '</div>';
    }
    if (q.guide) h += '<div class="tb-preview-guide"><strong>Solution:</strong> ' + rm(q.guide) + '</div>';
    c.innerHTML = h;
    p.style.display = '';
}

// ===== RECENT & REGENERATE =====
function tbSaveToRecent() {
    if (!TBState.questions.length) return;
    var name = document.getElementById('tb-name').value.trim() || 'Untitled';
    var recent = JSON.parse(localStorage.getItem('tb_recent_tests') || '[]');
    var bp = TBState.questions.map(function(q) {
        return { _skillType: q._skillType || null, _difficulty: q._lastDifficulty || 'normal', text: q.text, correct: q.correct, options: q.options, guide: q.guide, openEnded: q.openEnded, isCustom: q.isCustom };
    });
    recent.unshift({ name: name, date: new Date().toLocaleDateString(), questionCount: TBState.questions.length, blueprint: bp, id: 'tb_' + Date.now() });
    if (recent.length > 20) recent.pop();
    localStorage.setItem('tb_recent_tests', JSON.stringify(recent));
}

function tbShowRecent() {
    var p = document.getElementById('tb-recent-panel'), l = document.getElementById('tb-recent-list');
    var r = JSON.parse(localStorage.getItem('tb_recent_tests') || '[]');
    if (!r.length) {
        l.innerHTML = '<p style="color:var(--text-secondary);font-size:0.82rem;">No saved tests yet.</p>';
    } else {
        var h = '';
        r.forEach(function(e, i) {
            h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0.4rem;border-bottom:1px solid var(--border-color-light);font-size:0.82rem;cursor:pointer;" onclick="tbLoadRecent(' + i + ')">' +
                '<div><strong>' + e.name + '</strong> <span style="color:var(--text-secondary);">(' + e.questionCount + 'Q)</span></div>' +
                '<div style="color:var(--text-secondary);font-size:0.75rem;">' + e.date + '</div></div>';
        });
        l.innerHTML = h;
    }
    p.style.display = '';
}

function tbLoadRecent(i) {
    var r = JSON.parse(localStorage.getItem('tb_recent_tests') || '[]');
    var e = r[i];
    if (!e) return;
    document.getElementById('tb-name').value = e.name;
    TBState.questions.length = 0;
    TBState.editing.clear();
    e.blueprint.forEach(function(bp) {
        if (bp._skillType) {
            var ap = tbGetPool('all');
            var m = ap.filter(function(t) { return t.type === bp._skillType; });
            if (m.length) {
                var it = tbConstructItem(m[Math.floor(Math.random() * m.length)], bp._difficulty || 'normal');
                it._lastDifficulty = bp._difficulty;
                TBState.questions.push(it);
                return;
            }
        }
        TBState.questions.push({ text: bp.text, correct: bp.correct, options: bp.options, guide: bp.guide, openEnded: bp.openEnded, isCustom: bp.isCustom, _dynamic: false, _descriptor: null, _equation: null, _drawingDataUrl: null });
    });
    tbRender();
    document.getElementById('tb-recent-panel').style.display = 'none';
    document.getElementById('saved-status').textContent = 'Loaded "' + e.name + '" with fresh numbers';
    document.getElementById('saved-status').className = 'tb-status ok';
}

function tbRegenerate() {
    if (!TBState.questions.length) return;
    var n = 0;
    TBState.questions.forEach(function(q, i) {
        // If question has variableDescriptor, use generateFromDescriptor
        if (q._dynamic && q.variableDescriptor && typeof generateFromDescriptor === 'function') {
            try {
                var gen = generateFromDescriptor(q.variableDescriptor);
                if (gen) {
                    q.text = gen.q || gen.text || q.text;
                    q.correct = String(gen.ans || gen.correct || q.correct);
                    if (gen.distractors) {
                        var all = [q.correct].concat(gen.distractors.map(String));
                        var u = []; var seen = {};
                        all.forEach(function(x) { if (!seen[x]) { seen[x] = true; u.push(x); } });
                        u.sort(function() { return Math.random() - 0.5; });
                        q.options = u.slice(0, 4).map(function(c, j) { return String.fromCharCode(65 + j) + ') ' + c; });
                    }
                    if (gen.guide) q.guide = gen.guide;
                    n++;
                    return;
                }
            } catch(e) { console.warn('generateFromDescriptor failed for Q' + (i + 1), e); }
        }
        if (q._skillType) {
            var ap = tbGetPool('all');
            var m = ap.filter(function(t) { return t.type === q._skillType; });
            if (m.length) {
                var it = tbConstructItem(m[Math.floor(Math.random() * m.length)], q._lastDifficulty || 'normal');
                it._skillType = q._skillType;
                it._lastDifficulty = q._lastDifficulty;
                it._dynamic = q._dynamic;
                it._descriptor = q._descriptor;
                it.variableDescriptor = q.variableDescriptor;
                TBState.questions[i] = it;
                n++;
            }
        }
    });
    tbRender();
    document.getElementById('saved-status').textContent = 'Regenerated ' + n + '/' + TBState.questions.length + ' with new numbers';
    document.getElementById('saved-status').className = 'tb-status ok';
}

// ===== SAVED SKILLS (MY BANK) =====
async function tbLoadSavedSkills() {
    if (typeof fbGetCustomSkills !== 'function') {
        document.getElementById('saved-skill-list').innerHTML = '<div class="tb-empty" style="padding:1rem;">Firebase not ready -- try again.</div>';
        return;
    }
    if (!TBState.savedSkillsCache) {
        document.getElementById('saved-skill-list').innerHTML = '<div class="tb-empty" style="padding:1rem;">Loading...</div>';
        try {
            var timeout = new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Firestore request timed out')); }, 10000); });
            var raw = await Promise.race([fbGetCustomSkills(), timeout]);
            TBState.savedSkillsCache = Object.entries(raw).map(function(pair) { return Object.assign({ id: pair[0] }, pair[1]); });
        } catch(e) {
            document.getElementById('saved-skill-list').innerHTML = '<div class="tb-empty" style="padding:1rem;">Error loading skills. Check connection & retry.</div>';
            console.error('tbLoadSavedSkills:', e);
            return;
        }
    }
    tbPopulateSavedFilters();
    tbRenderSavedSkills();
}

function tbPopulateSavedFilters() {
    if (!TBState.savedSkillsCache) return;
    var grades = new Set(['3','4','5','6','7','8','algebra1']);
    var cats = new Set(['pssa','keystone']);
    var classes = new Set();
    var chapters = new Set();
    var anchors = new Set();
    TBState.savedSkillsCache.forEach(function(s) {
        if (s.grade) grades.add(s.grade);
        if (s.category) cats.add(s.category);
        if (s.skillClass) classes.add(s.skillClass);
        if (s.chapter) chapters.add(s.chapter);
        if (s.anchor) anchors.add(s.anchor);
    });

    var gradeLabel = function(g) {
        if (g === 'algebra1') return 'Keystone Algebra';
        if (/^\d+$/.test(g)) return 'Grade ' + g;
        return g;
    };
    var numericSort = function(a, b) {
        var na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        if (!isNaN(na)) return -1;
        if (!isNaN(nb)) return 1;
        return String(a).localeCompare(String(b));
    };

    function fillSelect(id, allLabel, values, labelFn) {
        var sel = document.getElementById(id);
        if (!sel) return;
        var cur = sel.value;
        sel.innerHTML = '<option value="all">' + allLabel + '</option>' +
            Array.from(values).sort(numericSort).map(function(v) {
                var text = labelFn ? labelFn(v) : v;
                return '<option value="' + String(v).replace(/"/g, '&quot;') + '">' + String(text).replace(/"/g, '&quot;') + '</option>';
            }).join('');
        sel.value = cur || 'all';
    }

    fillSelect('saved-grade', 'All Grades', grades, gradeLabel);
    fillSelect('saved-cat', 'All Categories', cats, function(c) { return c.charAt(0).toUpperCase() + c.slice(1); });
    fillSelect('saved-class', 'All Classes', classes);
    fillSelect('saved-chapter', 'All Chapters', chapters, function(c) { return /^\d/.test(c) ? 'Ch ' + c : c; });
    fillSelect('saved-anchor', 'All Standards', anchors);
}

function tbRenderSavedSkills() {
    var list = document.getElementById('saved-skill-list');
    if (!TBState.savedSkillsCache) { tbLoadSavedSkills(); return; }
    function fv(id) {
        var el = document.getElementById(id);
        return el ? el.value : 'all';
    }
    var grade = fv('saved-grade');
    var cat = fv('saved-cat');
    var cls = fv('saved-class');
    var chapter = fv('saved-chapter');
    var anchor = fv('saved-anchor');
    var search = ((document.getElementById('saved-search') || {}).value || '').toLowerCase();
    var skills = TBState.savedSkillsCache;
    if (grade !== 'all') skills = skills.filter(function(s) { return (s.grade || '') === grade; });
    if (cat !== 'all') skills = skills.filter(function(s) { return (s.category || 'pssa') === cat; });
    if (cls !== 'all') skills = skills.filter(function(s) { return (s.skillClass || '') === cls; });
    if (chapter !== 'all') skills = skills.filter(function(s) { return (s.chapter || '') === chapter; });
    if (anchor !== 'all') skills = skills.filter(function(s) { return (s.anchor || '') === anchor; });
    if (search) skills = skills.filter(function(s) {
        var haystack = [s.name, s.type, s.anchor, s.category, s.grade, s.skillClass, s.chapter, s.questionText]
            .map(function(x) { return String(x || ''); }).join(' ').toLowerCase();
        return haystack.indexOf(search) !== -1;
    });
    if (!skills.length) {
        list.innerHTML = '<div class="tb-empty" style="padding:1rem;">No saved templates. <a href="/admin/question-bank.html" target="_blank" style="color:var(--primary-color);">Open Question Bank</a></div>';
        return;
    }
    var gradeLabel = function(g) { return g === 'algebra1' ? 'Alg1' : 'G' + g; };
    list.innerHTML = skills.map(function(s) {
        var displayName = s.name || skillName(s.type) || s.type || 'Untitled';
        var qCount = (s.questions && s.questions.length) || 1;
        var hasDynamic = s.variableDescriptor || (s.questions && s.questions.some(function(q) { return q.variableDescriptor; }));
        var firstQ = (s.questions && s.questions[0]) ? s.questions[0].text : (s.questionText || '');
        var preview = (firstQ || '').replace(/<[^>]+>/g, '').slice(0, 55) + ((firstQ || '').length > 55 ? '...' : '');
        var tag = '<span class="tb-skill-grade">' + gradeLabel(s.grade || '?') + ' &middot; ' + (s.category || 'pssa').toUpperCase() + '</span>';
        var metaBits = [];
        if (s.skillClass) metaBits.push(s.skillClass);
        if (s.chapter) metaBits.push('Ch ' + s.chapter);
        if (s.anchor) metaBits.push(s.anchor);
        var metaTag = metaBits.length ? '<span class="tb-skill-grade">' + metaBits.join(' &middot; ') + '</span>' : '';
        var dynTag = hasDynamic ? '<span class="tb-skill-grade" style="color:var(--primary-color);border-color:var(--primary-color);">Dynamic</span>' : '';
        return '<div class="tb-skill-row" style="flex-direction:column;align-items:flex-start;gap:0.15rem;cursor:default;">' +
            '<div style="display:flex;align-items:center;gap:0.4rem;width:100%;">' +
            '<span class="tb-skill-name">' + displayName + '</span>' +
            tag + metaTag + dynTag +
            '<span class="tb-skill-count">' + qCount + 'Q</span></div>' +
            (preview ? '<div style="font-size:0.7rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">' + preview + '</div>' : '') +
            '<div style="display:flex;align-items:center;gap:0.3rem;margin-top:0.2rem;">' +
            '<input type="number" id="saved-qty-' + s.id + '" value="' + qCount + '" min="1" max="50" style="width:45px;padding:0.15rem 0.3rem;border:1px solid var(--border-color);border-radius:4px;font-size:0.75rem;text-align:center;">' +
            '<button class="tb-skill-add" onclick="tbAddAllFromSaved(\'' + s.id + '\')">+ Add</button></div>' +
            '</div>';
    }).join('');
}

/**
 * Generate a concrete question from a variable descriptor.
 * Returns a question object with real values filled in, ready for the test.
 */
function _tbGenerateFromDesc(desc, originalQ, letters) {
    var gen = generateFromDescriptor(desc);
    var text = gen.q || '';
    var correct = String(gen.ans || '');
    var opts = [];
    var isOE = desc.questionType === 'oe';

    // Build MC options if not open-ended
    if (!isOE && gen.distractors && gen.distractors.length) {
        var all = [correct].concat(gen.distractors.map(String));
        var unique = []; var seen = {};
        all.forEach(function(x) { if (!seen[x]) { seen[x] = true; unique.push(x); } });
        unique.sort(function() { return Math.random() - 0.5; });
        opts = unique.slice(0, 4).map(function(c, j) { return letters[j] + ') ' + c; });
    }

    return {
        text: text, correct: correct, options: opts, openEnded: isOE,
        guide: gen.guide || originalQ.guide || '', isCustom: true,
        visualHTML: originalQ.visualHTML || '', optionVisuals: originalQ.optionVisuals || null, answerVisual: originalQ.answerVisual || null,
        _dynamic: true, _descriptor: desc, variableDescriptor: desc,
        _equation: null, _drawingDataUrl: null
    };
}

/**
 * Try to generate a fresh question from the original template engine.
 * Returns a question object or null if no matching template found.
 */
function _tbGenerateFromTemplate(skill, letters) {
    var templateType = skill._templateType || skill.type;
    if (typeof extraTemplates === 'undefined') return null;

    // Search all pools for a matching template
    var cats = Object.keys(extraTemplates);
    for (var ci = 0; ci < cats.length; ci++) {
        var grades = Object.keys(extraTemplates[cats[ci]]);
        for (var gi = 0; gi < grades.length; gi++) {
            var pool = extraTemplates[cats[ci]][grades[gi]];
            var matches = pool.filter(function(t) { return t.type === templateType && typeof t.gen === 'function'; });
            if (matches.length) {
                var tpl = matches[Math.floor(Math.random() * matches.length)];
                try {
                    var item = tbConstructItem(tpl, 'normal');
                    item._savedId = null;
                    item._skillType = skill.type;
                    return item;
                } catch(e) { return null; }
            }
        }
    }
    return null;
}

/**
 * Generate one question from a saved skill, using the best available method:
 * 1. Original template gen() if seeded from templates
 * 2. Variable descriptor if dynamic
 * 3. Static copy as fallback
 */
function _tbGenerateOneFromSkill(skill, letters, qIndex) {
    // Method 1: Use original template engine for seeded skills
    if (skill.seededFromTemplate || skill._templateType) {
        var fromTpl = _tbGenerateFromTemplate(skill, letters);
        if (fromTpl) return fromTpl;
    }

    // Method 2: Use variable descriptor for dynamic skills
    var qs = skill.questions && skill.questions.length ? skill.questions : null;
    var idx = (typeof qIndex === 'number' && qs) ? ((qIndex % qs.length) + qs.length) % qs.length : 0;
    var q = qs ? qs[idx] : skill;
    var desc = (q.variableDescriptor) || skill.variableDescriptor || null;
    if (desc && typeof generateFromDescriptor === 'function') {
        var generated = _tbGenerateFromDesc(desc, q, letters);
        return generated;
    }

    // Method 3: Static copy
    var opts = q.options || [];
    if (opts.length && !opts[0].match(/^[A-D]\)/)) {
        opts = opts.map(function(o, i) { return letters[i] + ') ' + o; });
    }
    return {
        text: q.text || q.questionHTML || '', correct: q.correct || '', options: opts, openEnded: !!q.openEnded, guide: q.guide || '',
        isCustom: true, visualHTML: q.visualHTML || '', optionVisuals: q.optionVisuals || null, answerVisual: q.answerVisual || null,
        _dynamic: false, _descriptor: null, _equation: null, _drawingDataUrl: null, _skillType: skill.type
    };
}

function tbAddFromSaved(skillId, questionIndex) {
    var skill = (TBState.savedSkillsCache || []).find(function(s) { return s.id === skillId; });
    if (!skill) return;
    var letters = ['A','B','C','D'];
    var item = _tbGenerateOneFromSkill(skill, letters, questionIndex);
    item._savedId = skillId;
    TBState.questions.push(item);
    tbRender();
}

function tbAddAllFromSaved(id) {
    var skill = (TBState.savedSkillsCache || []).find(function(s) { return s.id === id; });
    if (!skill) return;
    var letters = ['A','B','C','D'];

    // Read quantity from the input
    var qtyEl = document.getElementById('saved-qty-' + id);
    var qty = qtyEl ? parseInt(qtyEl.value) || 1 : 1;
    qty = Math.max(1, Math.min(50, qty));

    // Walk through the skill's questions in order (cycling if qty exceeds the
    // bank's size) so each saved question gets its turn instead of only q[0].
    for (var n = 0; n < qty; n++) {
        var item = _tbGenerateOneFromSkill(skill, letters, n);
        item._savedId = id;
        TBState.questions.push(item);
    }

    tbRender();
    var displayName = skill.name || skillName(skill.type) || skill.type;
    document.getElementById('saved-status').textContent = 'Added ' + qty + 'Q from "' + displayName + '"';
    document.getElementById('saved-status').className = 'tb-status ok';
}

// ===== AI =====
function tbInitAIKey() {
    var stored = localStorage.getItem('mathsite_gemini_key');
    if (stored) {
        document.getElementById('ai-api-key').value = stored;
        document.getElementById('ai-key-status').textContent = 'Key loaded.';
        document.getElementById('ai-key-status').className = 'tb-status ok';
    }
}

function tbSaveAIKey() {
    var key = document.getElementById('ai-api-key').value.trim();
    var st = document.getElementById('ai-key-status');
    if (key) { localStorage.setItem('mathsite_gemini_key', key); st.textContent = 'Saved.'; st.className = 'tb-status ok'; }
    else { localStorage.removeItem('mathsite_gemini_key'); st.textContent = 'Cleared.'; st.className = 'tb-status'; }
}

function tbHandleAIFileSelect(e) { if (e.target.files[0]) tbLoadAIFile(e.target.files[0]); }
function tbHandleAIFileDrop(e) { if (e.dataTransfer.files[0]) tbLoadAIFile(e.dataTransfer.files[0]); }

function tbLoadAIFile(file) {
    var label = document.getElementById('ai-file-label');
    var clearBtn = document.getElementById('ai-file-clear');
    TBState.aiFileMime = file.type;
    var reader = new FileReader();
    reader.onload = function(e) {
        TBState.aiFileB64 = e.target.result.replace(/^data:[^;]+;base64,/, '');
        label.textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
        clearBtn.style.display = '';
        document.getElementById('ai-drop-zone').style.borderColor = 'var(--correct)';
    };
    reader.readAsDataURL(file);
}

function tbClearAIFile() {
    TBState.aiFileB64 = null; TBState.aiFileMime = null;
    document.getElementById('ai-file-label').textContent = 'Click or drag a file here';
    document.getElementById('ai-file-clear').style.display = 'none';
    document.getElementById('ai-drop-zone').style.borderColor = '';
    document.getElementById('ai-file-input').value = '';
}

async function tbGenerateWithAI() {
    var st = document.getElementById('ai-status');
    var apiKey = document.getElementById('ai-api-key').value.trim() || localStorage.getItem('mathsite_gemini_key') || '';
    if (!apiKey) { st.textContent = 'Enter a Gemini API key first.'; st.className = 'tb-status err'; return; }
    var prompt = document.getElementById('ai-prompt').value.trim();
    var qty = parseInt(document.getElementById('ai-qty').value) || 5;
    if (!prompt && !TBState.aiFileB64) { st.textContent = 'Enter a prompt or upload a file.'; st.className = 'tb-status err'; return; }

    st.textContent = 'Generating...'; st.className = 'tb-status';

    var systemInstruction = 'You are a math teacher creating ' + qty + ' multiple choice questions. Output ONLY in this exact format with no extra text:\n\n' +
        '1) [question text]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\n\n[continue for all questions]\n\nANSWERS\n[letter for Q1], [letter for Q2], ...\n\n' +
        'Rules:\n- Write fractions as 3/8 or 1/2\n- Use x for multiply, / for divide, ^2 for squared\n- Make wrong answers plausible\n- One correct answer per question';

    var userText = prompt || 'Extract and create ' + qty + ' math questions from the provided file.';
    var parts = [];
    if (TBState.aiFileB64) parts.push({ inlineData: { mimeType: TBState.aiFileMime, data: TBState.aiFileB64 } });
    parts.push({ text: systemInstruction + '\n\n' + userText });

    try {
        var res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
            { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: parts }] }) }
        );
        if (!res.ok) { var err = await res.json(); throw new Error(err.error && err.error.message ? err.error.message : 'API error ' + res.status); }
        var data = await res.json();
        var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : '';
        if (!text) throw new Error('Empty response from AI.');

        var parsed = tbParseText(text);
        if (!parsed.length) { st.textContent = 'AI responded but no questions were parsed. Check format.'; st.className = 'tb-status err'; return; }
        parsed.forEach(function(q) { TBState.questions.push(q); });
        st.textContent = 'Added ' + parsed.length + ' question' + (parsed.length !== 1 ? 's' : '') + ' from AI.';
        st.className = 'tb-status ok';
        tbRender();
    } catch(e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'tb-status err';
    }
}

// ===== SAVE TO LIBRARY =====
function tbUpdateLibGrade() {
    var cat = document.getElementById('lib-category').value;
    var gradeEl = document.getElementById('lib-grade');
    if (cat === 'keystone') {
        gradeEl.innerHTML = '<option value="algebra1">Algebra 1</option>';
    } else {
        gradeEl.innerHTML = '<option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8</option>';
    }
}

async function tbSaveToLibrary() {
    var status = document.getElementById('lib-status');
    var sName = document.getElementById('lib-skill-name').value.trim();
    if (!sName) { status.textContent = 'Enter a skill name.'; status.style.color = 'var(--incorrect)'; return; }

    var which = document.querySelector('input[name="lib-which"]:checked').value;
    var qs = which === 'selected'
        ? TBState.questions.filter(function(_, i) { return TBState.selected.has(i); })
        : TBState.questions;

    if (!qs.length) { status.textContent = which === 'selected' ? 'Select questions first (use checkboxes).' : 'No questions to save.'; status.style.color = 'var(--incorrect)'; return; }
    if (typeof fbSaveCustomSkill !== 'function') { status.textContent = 'Firebase not ready -- try again in a moment.'; status.style.color = 'var(--incorrect)'; return; }

    var category = document.getElementById('lib-category').value;
    var grade = document.getElementById('lib-grade').value;
    var anchor = document.getElementById('lib-anchor').value.trim();
    var type = sName.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join('');

    status.textContent = 'Saving ' + qs.length + ' question' + (qs.length !== 1 ? 's' : '') + '...';
    status.style.color = 'var(--text-secondary)';

    var saved = 0;
    for (var qi = 0; qi < qs.length; qi++) {
        var q = qs[qi];
        var opts = q.options || [];
        var distractors = opts.map(function(o) { return o.replace(/^[A-D]\)\s*/i, '').trim(); }).filter(function(o) { return o !== q.correct; });
        var id = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        var skillData = {
            type: type, anchor: anchor || '', category: category, grade: grade, openEnded: !!q.openEnded,
            dynamic: !!(q._dynamic && q._descriptor),
            questionText: q.text || '', questionHTML: q.text || '', answerText: q.correct || '',
            distractorTexts: q.openEnded ? [] : distractors,
            guideText: q.guide || (q.correct ? 'The correct answer is: ' + q.correct + '.' : ''),
            updatedAt: new Date().toISOString()
        };
        try { await fbSaveCustomSkill(id, skillData); saved++; } catch(e) { console.error('Failed to save question to library:', e); }
    }

    if (saved === qs.length) {
        status.textContent = 'Saved ' + saved + ' question' + (saved !== 1 ? 's' : '') + ' to "' + sName + '" in ' + (category === 'keystone' ? 'Keystone' : 'PSSA Grade ' + grade) + '!';
        status.style.color = 'var(--correct)';
        document.getElementById('lib-skill-name').value = '';
        document.getElementById('lib-anchor').value = '';
        if (typeof loadCustomSkillsIntoPool === 'function') { await loadCustomSkillsIntoPool(); tbPopulateSkills(); }
        TBState.savedSkillsCache = null;
    } else {
        status.textContent = 'Saved ' + saved + '/' + qs.length + ' -- some failed (check console).';
        status.style.color = 'var(--incorrect)';
    }
}

// ===== LOAD CUSTOM SKILLS FROM FIREBASE =====
async function loadCustomSkillsIntoPool() {
    if (typeof fbGetCustomSkills !== 'function' || typeof extraTemplates === 'undefined') return;
    try {
        var _timeout = new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Firestore request timed out')); }, 10000); });
        var skills = await Promise.race([fbGetCustomSkills(), _timeout]);
        Object.entries(skills).forEach(function(pair) {
            var id = pair[0], skill = pair[1];
            var cat = skill.category || 'pssa';
            var grade = skill.grade || '3';
            if (!extraTemplates[cat]) extraTemplates[cat] = {};
            if (!extraTemplates[cat][grade]) extraTemplates[cat][grade] = [];
            if (extraTemplates[cat][grade].some(function(t) { return t._customId === id; })) return;
            var template;
            if (typeof buildGeneratorFromSkill === 'function') {
                template = buildGeneratorFromSkill(skill);
            } else {
                template = {
                    type: skill.type, anchor: skill.anchor || '', openEnded: !!skill.openEnded, _isCustom: true,
                    gen: function() { return { q: skill.questionHTML || skill.questionText || '', ans: skill.answerText || '', distractors: skill.openEnded ? [] : (skill.distractorTexts || []), guide: skill.guideText || '' }; }
                };
            }
            template._customId = id;
            extraTemplates[cat][grade].push(template);
        });
    } catch(e) { console.warn('Could not load custom skills:', e); }
}

// ===== TEMPLATE LOADER =====
var _tplEntries = []; // cached list of all template entries

function tbOpenTemplateLoader() {
    if (typeof extraTemplates === 'undefined') {
        document.getElementById('saved-status').textContent = 'Templates not loaded yet.';
        document.getElementById('saved-status').className = 'tb-status err';
        return;
    }
    // Build flat list of all template skills
    _tplEntries = [];
    var categories = Object.keys(extraTemplates);
    for (var ci = 0; ci < categories.length; ci++) {
        var cat = categories[ci];
        var grades = Object.keys(extraTemplates[cat]);
        for (var gi = 0; gi < grades.length; gi++) {
            var grade = grades[gi];
            var pool = extraTemplates[cat][grade];
            var byType = {};
            pool.forEach(function(t) {
                if (t._customId) return;
                if (!byType[t.type]) byType[t.type] = { type: t.type, anchor: t.anchor || '', openEnded: !!t.openEnded, templates: [], cat: cat, grade: grade };
                byType[t.type].templates.push(t);
            });
            Object.values(byType).forEach(function(s) {
                var name = skillName(s.type) || s.type;
                // Generate a sample preview
                var preview = '';
                try {
                    var item = tbConstructItem(s.templates[0], 'normal');
                    preview = (item.text || '').replace(/<[^>]+>/g, '').slice(0, 80);
                } catch(e) {}
                _tplEntries.push({
                    type: s.type,
                    name: name,
                    anchor: s.anchor,
                    cat: s.cat,
                    grade: s.grade,
                    openEnded: s.openEnded,
                    templates: s.templates,
                    preview: preview,
                    selected: false
                });
            });
        }
    }
    _tplEntries.sort(function(a, b) { return a.name.localeCompare(b.name); });

    document.getElementById('tb-tpl-modal').classList.add('active');
    tbRenderTemplateList();
}

function tbRenderTemplateList() {
    var list = document.getElementById('tpl-list');
    var grade = document.getElementById('tpl-grade').value;
    var search = (document.getElementById('tpl-search').value || '').toLowerCase();

    var filtered = _tplEntries;
    if (grade !== 'all') filtered = filtered.filter(function(e) { return e.grade === grade; });
    if (search) filtered = filtered.filter(function(e) {
        return (e.name + ' ' + e.anchor + ' ' + e.preview).toLowerCase().indexOf(search) >= 0;
    });

    if (!filtered.length) {
        list.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-secondary);">No templates found.</div>';
        _tplUpdateCount();
        return;
    }

    var gradeLabel = function(g) { return g === 'algebra1' ? 'Alg1' : 'G' + g; };
    list.innerHTML = filtered.map(function(e, idx) {
        var realIdx = _tplEntries.indexOf(e);
        return '<label class="tpl-row' + (e.selected ? ' selected' : '') + '" style="display:flex;gap:0.5rem;align-items:flex-start;padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color-light);cursor:pointer;font-size:0.82rem;">' +
            '<input type="checkbox" ' + (e.selected ? 'checked' : '') + ' onchange="tbTplToggle(' + realIdx + ',this.checked)" style="margin-top:0.15rem;flex-shrink:0;">' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;gap:0.3rem;align-items:center;flex-wrap:wrap;">' +
            '<strong style="color:var(--text-main);">' + e.name + '</strong>' +
            '<span style="font-size:0.65rem;padding:0.1rem 0.3rem;background:var(--bg-surface);border:1px solid var(--border-color-light);border-radius:3px;color:var(--text-secondary);">' + gradeLabel(e.grade) + ' &middot; ' + e.cat.toUpperCase() + '</span>' +
            (e.openEnded ? '<span style="font-size:0.6rem;color:var(--text-secondary);">OE</span>' : '') +
            '</div>' +
            (e.anchor ? '<div style="font-size:0.7rem;color:var(--text-secondary);">' + e.anchor + '</div>' : '') +
            (e.preview ? '<div style="font-size:0.72rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + e.preview + '</div>' : '') +
            '</div></label>';
    }).join('');
    _tplUpdateCount();
}

function tbTplToggle(idx, checked) {
    _tplEntries[idx].selected = checked;
    _tplUpdateCount();
}

function tbTplSelectAll() {
    var grade = document.getElementById('tpl-grade').value;
    var search = (document.getElementById('tpl-search').value || '').toLowerCase();
    _tplEntries.forEach(function(e) {
        var gradeMatch = grade === 'all' || e.grade === grade;
        var searchMatch = !search || (e.name + ' ' + e.anchor + ' ' + e.preview).toLowerCase().indexOf(search) >= 0;
        if (gradeMatch && searchMatch) e.selected = true;
    });
    tbRenderTemplateList();
}

function tbTplSelectNone() {
    _tplEntries.forEach(function(e) { e.selected = false; });
    tbRenderTemplateList();
}

function _tplUpdateCount() {
    var count = _tplEntries.filter(function(e) { return e.selected; }).length;
    document.getElementById('tpl-selected-count').textContent = count;
}

async function tbImportSelectedTemplates() {
    if (typeof fbSaveCustomSkill !== 'function') {
        document.getElementById('tpl-status').textContent = 'Firebase not ready.';
        return;
    }
    var selected = _tplEntries.filter(function(e) { return e.selected; });
    if (!selected.length) {
        document.getElementById('tpl-status').textContent = 'Select templates first.';
        return;
    }

    // Load existing to check duplicates
    var existing = {};
    try {
        var raw = await fbGetCustomSkills();
        Object.values(raw).forEach(function(s) {
            if (s.seededFromTemplate) {
                existing[(s.category || '') + '_' + (s.grade || '') + '_' + (s.name || '')] = true;
            }
        });
    } catch(e) {}

    var st = document.getElementById('tpl-status');
    var saved = 0, skipped = 0, failed = 0;

    for (var i = 0; i < selected.length; i++) {
        var s = selected[i];
        var dupKey = s.cat + '_' + s.grade + '_' + s.name;
        if (existing[dupKey]) { skipped++; continue; }

        var question;
        try {
            var item = tbConstructItem(s.templates[0], 'normal');
            question = {
                text: item.text, options: item.options || [], correct: item.correct,
                guide: item.guide || '', openEnded: item.openEnded || false,
                isCustom: true, variableDescriptor: null
            };
        } catch(e) { failed++; continue; }

        var id = 'tpl_' + s.cat + '_' + s.grade + '_' + s.type.replace(/\s+/g, '_') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        var typeName = s.name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join('');

        try {
            await fbSaveCustomSkill(id, {
                type: typeName, name: s.name, anchor: s.anchor, category: s.cat, grade: s.grade,
                questions: [question], questionText: question.text, questionHTML: question.text,
                answerText: question.correct,
                distractorTexts: (question.options || []).filter(function(o) { return o.replace(/^[A-D]\)\s*/, '') !== question.correct; }).map(function(o) { return o.replace(/^[A-D]\)\s*/, ''); }),
                guideText: question.guide, openEnded: !!s.openEnded, dynamic: false,
                seededFromTemplate: true, _templateType: s.type,
                updatedAt: new Date().toISOString(), createdAt: new Date().toISOString()
            });
            saved++;
            st.innerHTML = '<span id="tpl-selected-count">' + (selected.length - i - 1) + '</span> remaining... ' + saved + ' imported';
        } catch(e) { failed++; }
    }

    st.innerHTML = '<span id="tpl-selected-count">0</span> selected &mdash; Imported ' + saved + (skipped ? ', ' + skipped + ' already existed' : '') + (failed ? ', ' + failed + ' failed' : '');
    document.getElementById('saved-status').textContent = 'Imported ' + saved + ' templates';
    document.getElementById('saved-status').className = 'tb-status ok';

    // Deselect imported
    _tplEntries.forEach(function(e) { e.selected = false; });
    tbRenderTemplateList();

    TBState.savedSkillsCache = null;
    await tbLoadSavedSkills();
}

// ===== CLEAR ALL SKILLS =====
async function tbClearAllSkills() {
    if (typeof fbGetCustomSkills !== 'function' || typeof fbDeleteCustomSkill !== 'function') {
        document.getElementById('saved-status').textContent = 'Firebase not ready.';
        document.getElementById('saved-status').className = 'tb-status err';
        return;
    }
    if (!confirm('Delete ALL skills from My Bank? This cannot be undone.')) return;
    var code = prompt('Type "epur" to confirm deletion:');
    if (code !== 'epur') {
        document.getElementById('saved-status').textContent = 'Cancelled.';
        document.getElementById('saved-status').className = 'tb-status';
        return;
    }

    var st = document.getElementById('saved-status');
    st.innerHTML = '<span class="admin-loading"></span> Deleting...';
    st.className = 'tb-status';

    try {
        var raw = await fbGetCustomSkills();
        var ids = Object.keys(raw);
        var deleted = 0;
        for (var i = 0; i < ids.length; i++) {
            await fbDeleteCustomSkill(ids[i]);
            deleted++;
            st.textContent = 'Deleting... ' + deleted + '/' + ids.length;
        }
        st.textContent = 'Cleared ' + deleted + ' skills.';
        st.className = 'tb-status ok';
    } catch(e) {
        st.textContent = 'Error: ' + e.message;
        st.className = 'tb-status err';
    }

    TBState.savedSkillsCache = null;
    await tbLoadSavedSkills();
}

// ===== ACCORDION TOGGLE =====
function tbToggleAccordion(sectionId, btn) {
    var body = document.getElementById(sectionId);
    if (!body) return;
    var isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    btn.classList.toggle('open', !isOpen);
    var arrow = btn.querySelector('.tb-accordion-arrow');
    if (arrow) arrow.textContent = isOpen ? '\u25B6' : '\u25BC';
}

// ===== POPULATE METADATA DATALISTS =====
async function tbPopulateMetadataLists() {
    var catList = document.getElementById('tb-category-list');
    var grdList = document.getElementById('tb-test-grade-list');
    var clsList = document.getElementById('tb-test-class-list');
    var chpList = document.getElementById('tb-test-chapter-list');
    if (!catList || !grdList || !clsList) return;

    // Defaults
    var categories = new Set(['PSSA', 'Keystone']);
    var grades = new Set(['3', '4', '5', '6', '7', '8']);
    var classes = new Set();
    var chapters = new Set();

    // Pull existing values from saved tests
    var retries = 0;
    while (typeof fbGetCustomTests !== 'function' && retries++ < 20) await new Promise(function(r) { setTimeout(r, 150); });
    if (typeof fbGetCustomTests === 'function') {
        try {
            var tests = await fbGetCustomTests();
            Object.values(tests).forEach(function(t) {
                if (t.category) categories.add(t.category);
                if (t.testGrade) grades.add(t.testGrade);
                if (t.testClass) classes.add(t.testClass);
                if (t.chapter) chapters.add(t.chapter);
            });
        } catch(e) { /* ignore */ }
    }

    // Also seed from saved skills so the author sees existing chapter labels
    if (TBState.savedSkillsCache) {
        TBState.savedSkillsCache.forEach(function(s) {
            if (s.chapter) chapters.add(s.chapter);
            if (s.skillClass) classes.add(s.skillClass);
        });
    }

    // Pull class IDs from class data
    if (typeof fbGetClassData === 'function') {
        try {
            var classData = await fbGetClassData();
            Object.keys(classData).forEach(function(k) { classes.add(k); });
        } catch(e) { /* ignore */ }
    }

    function fillDatalist(dl, values) {
        if (!dl) return;
        dl.innerHTML = '';
        Array.from(values).sort().forEach(function(v) {
            var opt = document.createElement('option');
            opt.value = v;
            dl.appendChild(opt);
        });
    }
    fillDatalist(catList, categories);
    fillDatalist(grdList, grades);
    fillDatalist(clsList, classes);
    fillDatalist(chpList, chapters);
}

// ===== INIT =====
function tbInit() {
    tbRender();
    (function initSkills() {
        if (typeof extraTemplates !== 'undefined') {
            if (typeof fbGetCustomSkills === 'function') {
                loadCustomSkillsIntoPool().then(function() { tbPopulateSkills(); });
            } else {
                var attempts = 0;
                (function waitFB() {
                    if (typeof fbGetCustomSkills === 'function') { loadCustomSkillsIntoPool().then(function() { tbPopulateSkills(); }); }
                    else if (attempts++ < 30) { setTimeout(waitFB, 200); }
                    else { tbPopulateSkills(); }
                })();
            }
        } else { setTimeout(initSkills, 100); }
    })();

    tbInitAIKey();
    tbLoadSavedSkills();
    tbPopulateMetadataLists();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            tbSaveTestOnly();
        }
    });
}

window.addEventListener('load', tbInit);
