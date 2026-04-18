/**
 * Dynamic Test Generator
 * Converts static pasted questions into dynamic templates with randomized numbers.
 * No AI — uses brute-force arithmetic detection + cosmetic number swapping.
 */

// ========== FRACTION HTML FORMATTING ==========

/**
 * Convert plain-text fractions and mixed numbers to stacked HTML.
 * "3/8" → "<sup>3</sup>/<sub>8</sub>"
 * "4 1/3" → "4<sup>1</sup>/<sub>3</sub>"
 */
function fracToHTML(text) {
    // Mixed numbers first: "4 1/3" → "4 <sup>1</sup>/<sub>3</sub>"
    let result = text.replace(/(\d+)\s+(\d+)\/(\d+)/g, '$1 <sup>$2</sup>/<sub>$3</sub>');
    // Plain fractions: "3/8" → "<sup>3</sup>/<sub>8</sub>" (but not inside HTML tags already)
    result = result.replace(/(?<!<sub>|<sup>)(\d+)\/(\d+)(?!<)/g, '<sup>$1</sup>/<sub>$2</sub>');
    return result;
}

// ========== NUMBER EXTRACTION (for arithmetic detection) ==========

function extractNumbers(text) {
    const results = [];
    const cleaned = text.replace(/^\s*\d+[.)]\s+/, '');
    const regex = /\$?(-?\d+(?:\.\d+)?)/g;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val !== 0) {
            results.push({
                value: val,
                original: match[0],
                index: results.length,
                start: match.index,
                isCurrency: match[0].startsWith('$'),
                isDecimal: match[1].includes('.')
            });
        }
    }
    return results;
}

// ========== OPERATION DETECTION ==========

function detectOperation(numbers, answer) {
    if (numbers.length < 2 || isNaN(answer)) return null;
    const tolerance = 0.01;
    const close = (a, b) => Math.abs(a - b) < tolerance;

    for (let i = 0; i < numbers.length; i++) {
        for (let j = 0; j < numbers.length; j++) {
            if (i === j) continue;
            const a = numbers[i].value, b = numbers[j].value;
            if (close(a * b, answer)) return { type: 'multiply', operands: [i, j] };
            if (close(a + b, answer)) return { type: 'add', operands: [i, j] };
            if (close(a - b, answer)) return { type: 'subtract', operands: [i, j] };
            if (b !== 0 && close(a / b, answer)) return { type: 'divide', operands: [i, j] };
        }
    }

    if (numbers.length >= 3) {
        for (let i = 0; i < numbers.length; i++) {
            for (let j = 0; j < numbers.length; j++) {
                if (i === j) continue;
                for (let k = 0; k < numbers.length; k++) {
                    if (k === i || k === j) continue;
                    const a = numbers[i].value, b = numbers[j].value, c = numbers[k].value;
                    if (close(a * b * c, answer)) return { type: 'multiply3', operands: [i, j, k] };
                    if (close(a * b + c, answer)) return { type: 'multiply_add', operands: [i, j, k] };
                    if (close(a * b - c, answer)) return { type: 'multiply_subtract', operands: [i, j, k] };
                    if (close((a + b) * c, answer)) return { type: 'add_multiply', operands: [i, j, k] };
                    if (close(a + b + c, answer)) return { type: 'add3', operands: [i, j, k] };
                }
            }
        }
    }
    return null;
}

// ========== ARITHMETIC DESCRIPTOR (computed answers) ==========

function computeRange(value) {
    const abs = Math.abs(value);
    // For decimals, keep range in same decimal granularity
    const str = value.toString();
    if (str.includes('.')) {
        const decimals = str.split('.')[1].length;
        const scale = Math.pow(10, decimals);
        const scaled = Math.round(abs * scale);
        const min = Math.max(1, Math.round(scaled * 0.5));
        const max = Math.round(scaled * 1.5);
        return { min: min / scale, max: max / scale };
    }
    if (abs <= 1) return { min: 1, max: 5 };
    if (abs <= 10) return { min: Math.max(2, Math.floor(abs * 0.5)), max: Math.ceil(abs * 2) };
    if (abs <= 100) return { min: Math.max(2, Math.floor(abs * 0.5 / 5) * 5), max: Math.ceil(abs * 2 / 5) * 5 };
    return { min: Math.max(10, Math.floor(abs * 0.5 / 10) * 10), max: Math.ceil(abs * 1.5 / 10) * 10 };
}

function buildDescriptor(questionText, numbers, operation, answer) {
    let textTemplate = questionText.replace(/^\s*\d+[.)]\s+/, '');
    const sorted = [...numbers].sort((a, b) => b.start - a.start);
    sorted.forEach(n => {
        const prefix = n.isCurrency ? '$' : '';
        const placeholder = prefix + `{${n.index}}`;
        const pos = textTemplate.indexOf(n.original);
        if (pos >= 0) {
            textTemplate = textTemplate.substring(0, pos) + placeholder + textTemplate.substring(pos + n.original.length);
        }
    });

    const slots = numbers.map(n => {
        const range = computeRange(n.value);
        return { index: n.index, original: n.value, min: range.min, max: range.max, isCurrency: n.isCurrency, isDecimal: n.isDecimal };
    });

    let answerFormat = 'integer';
    if (numbers.some(n => n.isCurrency)) answerFormat = 'currency';
    else if (numbers.some(n => n.isDecimal) || String(answer).includes('.')) answerFormat = 'decimal';

    return { textTemplate, slots, operation, answerFormat, openEnded: false };
}

function computeAnswer(vals, operation) {
    const ops = operation.operands;
    switch (operation.type) {
        case 'multiply': return vals[ops[0]] * vals[ops[1]];
        case 'multiply3': return vals[ops[0]] * vals[ops[1]] * vals[ops[2]];
        case 'add': return vals[ops[0]] + vals[ops[1]];
        case 'subtract': return vals[ops[0]] - vals[ops[1]];
        case 'divide': return vals[ops[0]] / vals[ops[1]];
        case 'multiply_add': return vals[ops[0]] * vals[ops[1]] + vals[ops[2]];
        case 'multiply_subtract': return vals[ops[0]] * vals[ops[1]] - vals[ops[2]];
        case 'add_multiply': return (vals[ops[0]] + vals[ops[1]]) * vals[ops[2]];
        case 'add3': return vals[ops[0]] + vals[ops[1]] + vals[ops[2]];
        default: return 0;
    }
}

function formatDynamicAnswer(value, format) {
    if (format === 'currency') return '$' + value.toFixed(2);
    if (format === 'decimal') return parseFloat(value.toFixed(2)).toString();
    return Math.round(value).toString();
}

function makeDynamicDistractors(answer, vals, operation) {
    const ops = operation.operands;
    const a = vals[ops[0]], b = vals[ops[1]];
    let d = [];
    switch (operation.type) {
        case 'multiply': case 'multiply3': d = [a + b, answer + a, answer - b]; break;
        case 'add': d = [a * b, answer + 1, Math.abs(a - b)]; break;
        case 'subtract': d = [a + b, answer + 1, b - a]; break;
        case 'divide': d = [a * b, a - b, answer + 1]; break;
        default: d = [answer + 1, answer - 1, answer + 10];
    }
    d = d.map(v => Math.round(Math.abs(v) * 100) / 100);
    const ansR = Math.round(answer * 100) / 100;
    d = d.filter(v => v !== ansR && v > 0);
    while (d.length < 3) {
        const f = ansR + rand(1, 5) * (rand(0, 1) ? 1 : -1);
        if (f > 0 && f !== ansR && !d.includes(f)) d.push(f);
    }
    return d.slice(0, 3);
}

function buildDynamicGuide(vals, operation, answer) {
    const ops = operation.operands;
    const a = vals[ops[0]], b = vals[ops[1]];
    const sym = { multiply: '×', add: '+', subtract: '-', divide: '÷' };
    if (sym[operation.type]) return `${a} ${sym[operation.type]} ${b} = ${Math.round(answer * 100) / 100}.`;
    const c = ops[2] !== undefined ? vals[ops[2]] : 0;
    if (operation.type === 'multiply3') return `${a} × ${b} × ${c} = ${Math.round(answer * 1000) / 1000}.`;
    return `The answer is ${Math.round(answer * 100) / 100}.`;
}

function randForSlot(slot) {
    if (slot.isDecimal) {
        // Figure out decimal places from original value
        const str = slot.original.toString();
        const decimals = str.includes('.') ? str.split('.')[1].length : 0;
        const scale = Math.pow(10, decimals);
        const min = Math.round(slot.min * scale);
        const max = Math.round(slot.max * scale);
        return rand(min, max) / scale;
    }
    return rand(slot.min, slot.max);
}

function generateSlotValues(descriptor) {
    const slots = descriptor.slots;
    const op = descriptor.operation;
    const vals = [];

    if (op.type === 'divide') {
        const dIdx = op.operands[1], nIdx = op.operands[0];
        const divisor = randForSlot(slots[dIdx]);
        const quotient = rand(2, Math.max(2, Math.floor(slots[nIdx].max / divisor)));
        for (let i = 0; i < slots.length; i++) {
            if (i === dIdx) vals[i] = divisor;
            else if (i === nIdx) vals[i] = divisor * quotient;
            else vals[i] = randForSlot(slots[i]);
        }
    } else {
        for (let i = 0; i < slots.length; i++) {
            vals[i] = randForSlot(slots[i]);
        }
        if ((op.type === 'subtract' || op.type === 'multiply_subtract') && computeAnswer(vals, op) < 0) {
            const t = vals[op.operands[0]]; vals[op.operands[0]] = vals[op.operands[1]]; vals[op.operands[1]] = t;
        }
    }
    return vals;
}

// ========== REHYDRATE (arithmetic) ==========

function rehydrate(descriptor) {
    if (descriptor.operation && descriptor.operation.type === 'user-defined') {
        return rehydrateUserDefined(descriptor);
    }
    if (descriptor.operation && descriptor.operation.type === 'cosmetic') {
        return rehydrateCosmetic(descriptor);
    }
    return {
        type: 'dynamic', anchor: 'Dynamic question', openEnded: false,
        gen: function() {
            const vals = generateSlotValues(descriptor);
            const answer = computeAnswer(vals, descriptor.operation);
            const q = descriptor.textTemplate.replace(/\$?\{(\d+)\}/g, (m, idx) => {
                const s = descriptor.slots[parseInt(idx)], v = vals[parseInt(idx)];
                if (s && s.isCurrency) return '$' + v.toFixed(2);
                if (s && s.isDecimal) {
                    const dec = s.original.toString().split('.')[1];
                    const places = dec ? dec.length : 1;
                    return v.toFixed(places);
                }
                return v.toString();
            });
            return {
                q, ans: formatDynamicAnswer(answer, descriptor.answerFormat),
                distractors: makeDynamicDistractors(answer, vals, descriptor.operation).map(d => formatDynamicAnswer(d, descriptor.answerFormat)),
                guide: buildDynamicGuide(vals, descriptor.operation, answer)
            };
        }
    };
}

// ========== COSMETIC SWAP (for ALL questions — swaps numbers keeping same shape) ==========

/**
 * Extract number tokens preserving their exact form.
 * Handles: mixed numbers (4 1/3), fractions (3/8), negatives (-12),
 * comma numbers (48,200), percentages (82%), decimals (28.2), integers.
 * Returns unique tokens sorted longest-first.
 */
function extractTokens(text) {
    const tokens = [];
    const seen = new Set();
    const usedRanges = [];

    // Pass 1: Mixed numbers like "4 1/3" or "28 1/2"
    const mixedRe = /(\d+)\s+(\d+\/\d+)/g;
    let m;
    while ((m = mixedRe.exec(text)) !== null) {
        const tok = m[0]; // e.g. "4 1/3"
        if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
        usedRanges.push([m.index, m.index + tok.length]);
    }

    // Pass 2: Fractions like "3/8" (not already part of mixed numbers)
    const fracRe = /\d+\/\d+/g;
    while ((m = fracRe.exec(text)) !== null) {
        if (usedRanges.some(([s, e]) => m.index >= s && m.index + m[0].length <= e)) continue;
        const tok = m[0];
        if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
        usedRanges.push([m.index, m.index + m[0].length]);
    }

    // Pass 3: Everything else — negatives, decimals, comma numbers, percentages, integers
    const numRe = /-?\d[\d,]*\.?\d*%?/g;
    while ((m = numRe.exec(text)) !== null) {
        if (usedRanges.some(([s, e]) => m.index >= s && m.index + m[0].length <= e)) continue;
        const tok = m[0];
        if (!seen.has(tok)) { seen.add(tok); tokens.push(tok); }
    }

    return tokens;
}

/**
 * Generate a random variation of a token, keeping same shape and similar magnitude.
 */
function randomizeToken(tok) {
    // Mixed number like "4 1/3"
    if (/^\d+\s+\d+\/\d+$/.test(tok)) {
        const parts = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        const whole = parseInt(parts[1]), n = parseInt(parts[2]), d = parseInt(parts[3]);
        const newWhole = rand(Math.max(1, whole - 3), whole + 3);
        const newN = rand(1, d - 1);
        return `${newWhole} ${newN}/${d}`;
    }

    // Fraction like "3/8"
    if (/^\d+\/\d+$/.test(tok)) {
        const [n, d] = tok.split('/').map(Number);
        const newD = rand(Math.max(2, d - 2), d + 2);
        const newN = rand(1, newD - 1);
        return `${newN}/${newD}`;
    }

    // Percentage like "82%"
    if (/^\d+%$/.test(tok)) {
        const v = parseInt(tok);
        return rand(Math.max(10, v - 15), Math.min(99, v + 15)) + '%';
    }

    // Negative integer like "-12" or "-20"
    if (/^-\d+$/.test(tok)) {
        const v = Math.abs(parseInt(tok));
        return '-' + rand(Math.max(1, v - 5), v + 5);
    }

    // Comma number like "48,200"
    if (/^\d{1,3}(,\d{3})+$/.test(tok)) {
        const v = parseInt(tok.replace(/,/g, ''));
        const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
        const newV = rand(Math.floor(v * 0.7 / 100) * 100, Math.ceil(v * 1.3 / 100) * 100);
        return newV.toLocaleString();
    }

    // Decimal like "28.2" or "0.3"
    if (/^\d+\.\d+$/.test(tok)) {
        const v = parseFloat(tok);
        const decimals = tok.split('.')[1].length;
        const scale = Math.pow(10, decimals);
        const vScaled = Math.round(v * scale);
        const min = Math.max(1, Math.round(vScaled * 0.7));
        const max = Math.round(vScaled * 1.3);
        const newV = rand(min, max) / scale;
        return newV.toFixed(decimals);
    }

    // Plain integer
    if (/^\d+$/.test(tok)) {
        const v = parseInt(tok);
        if (v <= 2) return tok; // don't randomize tiny structural numbers
        if (v <= 10) return rand(Math.max(2, v - 2), v + 2).toString();
        if (v <= 100) return rand(Math.max(5, v - 10), v + 10).toString();
        return rand(Math.floor(v * 0.7), Math.ceil(v * 1.3)).toString();
    }

    return tok;
}

/**
 * Build a cosmetic descriptor from question text, correct answer, and all options.
 */
function buildCosmeticDescriptor(questionText, correctAnswer, allOptions) {
    const allText = [questionText, correctAnswer, ...allOptions].join(' ||| ');
    const tokens = extractTokens(allText);
    if (tokens.length === 0) return null;

    // Single-pass templateize: replace all tokens at once, longest first
    function templateize(text) {
        const sorted = [...tokens].sort((a, b) => b.length - a.length);
        const escaped = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const combined = new RegExp(escaped.join('|'), 'g');
        return text.replace(combined, (match) => {
            const idx = tokens.indexOf(match);
            return idx >= 0 ? `{${idx}}` : match;
        });
    }

    return {
        textTemplate: templateize(questionText),
        answerTemplate: templateize(correctAnswer),
        optionTemplates: allOptions.map(o => templateize(o)),
        tokens: tokens,
        operation: { type: 'cosmetic' },
        openEnded: false
    };
}

/**
 * Rehydrate cosmetic descriptor — generates linked replacements.
 * Fraction parts that appear standalone get linked to their parent fraction.
 */
function rehydrateCosmetic(descriptor) {
    return {
        type: 'dynamic-cosmetic', anchor: 'Dynamic question (cosmetic)', openEnded: false,
        gen: function() {
            const replacements = [];
            const partMap = {}; // maps standalone digits to their fraction replacement parts

            // First pass: generate replacements for each token
            descriptor.tokens.forEach((tok, i) => {
                // Check if this standalone number is a part of an already-replaced fraction/mixed
                if (partMap[tok] !== undefined) {
                    replacements[i] = partMap[tok];
                    return;
                }

                const newTok = randomizeToken(tok);
                replacements[i] = newTok;

                // If this is a fraction or mixed number, record its parts for linking
                if (/^\d+\s+\d+\/\d+$/.test(tok)) {
                    // Mixed number: "4 1/3" — parts are 4, 1, 3
                    const oldParts = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
                    const newParts = newTok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
                    if (oldParts && newParts) {
                        partMap[oldParts[1]] = newParts[1];
                        partMap[oldParts[2]] = newParts[2];
                        partMap[oldParts[3]] = newParts[3];
                    }
                } else if (/^\d+\/\d+$/.test(tok)) {
                    // Fraction: "3/8"
                    const [oN, oD] = tok.split('/');
                    const [nN, nD] = newTok.split('/');
                    partMap[oN] = nN;
                    partMap[oD] = nD;
                }
            });

            function fill(tmpl) {
                return tmpl.replace(/\{(\d+)\}/g, (_, idx) => replacements[parseInt(idx)] || _);
            }

            const q = fill(descriptor.textTemplate);
            const ans = fill(descriptor.answerTemplate);
            const distractors = descriptor.optionTemplates.map(t => fill(t)).filter(o => o !== ans);

            return { q, ans, distractors: distractors.slice(0, 3), guide: `The correct answer is: ${ans}` };
        }
    };
}

// ========== USER-DEFINED VARIABLE SUPPORT ==========

/**
 * Shared template filler: replace {N} placeholders with formatted values.
 */
function fillUserTemplate(template, vals, slots) {
    return template.replace(/\{(\d+)\}/g, function(match, idx) {
        var i = parseInt(idx);
        if (i >= slots.length || vals[i] === undefined) return match;
        var slot = slots[i];
        var v = vals[i];
        return formatUserSlotValue(v, slot);
    });
}

/**
 * Format a value according to its slot type.
 */
function formatUserSlotValue(value, slot) {
    // Operator variables: format symbols for display
    if (slot.kind === 'operator' || (slot.operators && slot.operators.length)) {
        var opMap = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
        return opMap[value] || String(value);
    }
    switch (slot.type) {
        case 'integer':
            return Math.round(value).toString();
        case 'decimal': {
            var places = inferDecimalPlaces(slot.original);
            return Number(value).toFixed(places);
        }
        case 'currency':
            return '$' + Number(value).toFixed(2);
        case 'percent':
            return Math.round(value) + '%';
        case 'word-choice':
            return String(value);
        case 'fraction':
            return String(value);
        case 'computed': {
            // Infer formatting from the computed result
            if (typeof value === 'string') return value;
            if (Number.isFinite(value)) {
                if (Number.isInteger(value)) return value.toString();
                return parseFloat(value.toFixed(4)).toString();
            }
            return String(value);
        }
        default:
            return String(value);
    }
}

/**
 * Format a user-chosen answer/distractor value.
 * `format` is { kind, places?, maxDenom? }. `kind` is one of:
 * 'auto' | 'integer' | 'decimal' | 'fraction' | 'percent' | 'currency'.
 * Non-numeric values are returned as-is (unless forced by kind).
 */
function formatUserAnswerValue(value, format) {
    if (!format || !format.kind || format.kind === 'auto') {
        if (typeof value === 'string') return value;
        if (Number.isFinite(value)) {
            if (Number.isInteger(value)) return value.toString();
            return parseFloat(Number(value).toFixed(4)).toString();
        }
        return String(value);
    }
    var num = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(num)) return String(value);
    switch (format.kind) {
        case 'integer':
            return Math.round(num).toString();
        case 'decimal': {
            var places = format.places != null ? format.places : 2;
            return num.toFixed(places);
        }
        case 'fraction':
            return decimalToFractionString(num, format.maxDenom || 100);
        case 'percent': {
            var pPlaces = format.places != null ? format.places : 0;
            var pVal = num * 100;
            return (pPlaces ? pVal.toFixed(pPlaces) : Math.round(pVal).toString()) + '%';
        }
        case 'currency':
            return '$' + num.toFixed(2);
        default:
            return String(value);
    }
}

/**
 * Convert a decimal to a simplified fraction string.
 * Brute-force search: for each denominator d up to maxDenom, picks the
 * closest n/d and keeps the best. This is simple, robust against float
 * imprecision, and matches user expectations for small-denominator results.
 * Handles negatives, mixed numbers, and near-integer inputs.
 */
function decimalToFractionString(value, maxDenom) {
    if (!Number.isFinite(value)) return String(value);
    var eps = 1e-9;
    // Snap to integer when essentially whole (handles 0.9999999 etc.)
    if (Math.abs(value - Math.round(value)) < eps) return Math.round(value).toString();

    var sign = value < 0 ? '-' : '';
    var x = Math.abs(value);
    var whole = Math.floor(x);
    var frac = x - whole;
    // frac itself could be near-whole (near 0 or near 1); handle below via the
    // "n === d" roll-over after best match is found.

    var bestN = 0, bestD = 1, bestErr = frac; // baseline: rounding down to 0
    // Also consider rounding up: candidate 1/1 = 1 inside the fractional range
    if (1 - frac < bestErr) { bestN = 1; bestD = 1; bestErr = 1 - frac; }

    for (var d = 2; d <= maxDenom; d++) {
        var n = Math.round(frac * d);
        if (n <= 0 || n > d) continue;
        var err = Math.abs(n / d - frac);
        if (err < bestErr) { bestN = n; bestD = d; bestErr = err; }
        if (err < eps) break;
    }

    // Roll over if best match equals 1 (frac was near 1 after all)
    if (bestN === bestD) { whole += 1; bestN = 0; bestD = 1; }
    if (bestN === 0) return sign + whole.toString();

    var g = _gcd(bestN, bestD);
    bestN = bestN / g; bestD = bestD / g;
    if (whole > 0) return sign + whole + ' ' + bestN + '/' + bestD;
    return sign + bestN + '/' + bestD;
}

function _gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
}

/**
 * Try to split an expression string at its top-level (outside parens) '/'
 * operator. Returns [numerator, denominator] string parts or null.
 * The RIGHTMOST top-level '/' is used so left-associativity is preserved:
 * "a / b / c" splits to ["a / b", "c"].
 */
function splitTopLevelDivide(expr) {
    var depth = 0;
    var lastSlash = -1;
    for (var i = 0; i < expr.length; i++) {
        var ch = expr.charAt(i);
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === '/' && depth === 0) lastSlash = i;
    }
    if (lastSlash < 0) return null;
    var num = expr.substring(0, lastSlash).trim();
    var den = expr.substring(lastSlash + 1).trim();
    if (!num || !den) return null;
    return [num, den];
}

/**
 * If the answer expression is a top-level quotient of integer-valued
 * sub-expressions, compute it as an exact reduced fraction string (e.g.
 * "3/17", "2 1/3"). Returns null when inapplicable so the caller can fall
 * back to decimal→fraction approximation.
 */
function computeExactFractionFromExpr(expr, vals, slots) {
    var parts = splitTopLevelDivide(expr);
    if (!parts) return null;
    function evalPart(p) {
        var safe = p;
        for (var k = 0; k < slots.length; k++) {
            if (slots[k].name) {
                safe = safe.replace(new RegExp('\\b' + slots[k].name + '\\b', 'g'), 'vals[' + k + ']');
            }
        }
        if (!_isSafeExpr(safe)) return null;
        try { return new Function('vals', 'return ' + safe)(vals); }
        catch (e) { return null; }
    }
    var n = evalPart(parts[0]);
    var d = evalPart(parts[1]);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    if (Math.abs(n - Math.round(n)) > 1e-9) return null;
    if (Math.abs(d - Math.round(d)) > 1e-9) return null;
    n = Math.round(n); d = Math.round(d);
    if (d < 0) { n = -n; d = -d; }
    var g = _gcd(Math.abs(n), d);
    n = n / g; d = d / g;
    return formatExactFraction(n, d);
}

/** Format an already-reduced integer fraction n/d as a display string. */
function formatExactFraction(n, d) {
    if (d === 1) return n.toString();
    var sign = n < 0 ? '-' : '';
    var absN = Math.abs(n);
    if (absN >= d) {
        var whole = Math.floor(absN / d);
        var rem = absN - whole * d;
        if (rem === 0) return sign + whole;
        return sign + whole + ' ' + rem + '/' + d;
    }
    return sign + absN + '/' + d;
}

/**
 * Resolve the answer's rendered string, preferring an exact fraction when
 * the answer template points at a computed slot whose expression is a
 * top-level quotient and the chosen answerFormat is 'fraction'. Falls back
 * to the standard fillUserTemplate + applyUserAnswerFormat pipeline.
 */
function resolveAnswerText(descriptor, vals, slots) {
    var rawAns = fillUserTemplate(descriptor.answerTemplate, vals, slots);
    var fmt = descriptor.answerFormat;
    if (fmt && fmt.kind === 'fraction') {
        var m = /^\$?\{(\d+)\}$/.exec(String(descriptor.answerTemplate || '').trim());
        if (m) {
            var idx = parseInt(m[1]);
            var slot = slots[idx];
            if (slot && slot.type === 'computed' && slot.expression) {
                var exact = computeExactFractionFromExpr(slot.expression, vals, slots);
                if (exact != null) return exact;
            }
        }
    }
    return applyUserAnswerFormat(rawAns, fmt);
}

/**
 * Infer decimal places from an original value string.
 */
function inferDecimalPlaces(original) {
    var str = String(original);
    if (str.includes('.')) {
        return str.split('.')[1].length;
    }
    return 2;
}

/**
 * Validate a computed expression to ensure it only contains safe characters.
 */
/**
 * Validate a computed expression. Allows:
 * - vals[N], numbers, basic operators (+, -, *, /, %, .)
 * - Math functions: sin, cos, tan, abs, sqrt, pow, round, floor, ceil, log, min, max
 * - Math constants: PI, E, LN2, SQRT2
 * - Parentheses, commas, spaces
 */
function _isSafeExpr(expr) {
    // Strip allowed tokens and see if anything remains
    var stripped = expr
        .replace(/vals\[\d+\]/g, '')          // vals[0], vals[1]...
        .replace(/Math\.(sin|cos|tan|asin|acos|atan|atan2|abs|sqrt|cbrt|pow|round|floor|ceil|log|log2|log10|min|max|sign|trunc|PI|E|LN2|LN10|SQRT2|SQRT1_2)/g, '')
        .replace(/[0-9+\-*/().,%\s]/g, '');
    return stripped.length === 0;
}

function isValidExpression(expr) {
    return _isSafeExpr(expr);
}

/**
 * Generate a random value for a user-defined slot.
 * If slot.allowedValues is a non-empty array, a value is picked uniformly
 * from it (numeric entries are coerced to numbers when parseable). This
 * overrides the min/max/step range. Integer/decimal/currency/percent slots
 * honour slot.step to generate values at a given interval.
 */
function generateUserSlotValue(slot) {
    // Operator variables: pick a random operator from the allowed set
    if (slot.kind === 'operator' || (slot.operators && slot.operators.length)) {
        var ops = slot.operators || ['+', '-', '*', '/'];
        return ops[rand(0, ops.length - 1)];
    }
    // Allowed-values override: works for any value type
    if (Array.isArray(slot.allowedValues) && slot.allowedValues.length) {
        var picked = slot.allowedValues[rand(0, slot.allowedValues.length - 1)];
        if (typeof picked === 'string' && /^-?\d+(\.\d+)?$/.test(picked)) return parseFloat(picked);
        return picked;
    }
    switch (slot.type) {
        case 'integer': {
            var iStep = (slot.step != null && slot.step > 0) ? Math.round(slot.step) : 1;
            if (iStep <= 1) return rand(slot.min, slot.max);
            var lo = Math.ceil(slot.min / iStep);
            var hi = Math.floor(slot.max / iStep);
            if (hi < lo) return slot.min;
            return rand(lo, hi) * iStep;
        }
        case 'decimal': {
            var places = inferDecimalPlaces(slot.original);
            var scale = Math.pow(10, places);
            var min = Math.round(slot.min * scale);
            var max = Math.round(slot.max * scale);
            return rand(min, max) / scale;
        }
        case 'fraction': {
            // Generate random fraction similar to randomizeToken logic
            var origStr = String(slot.original);
            if (/^\d+\s+\d+\/\d+$/.test(origStr)) {
                // Mixed number
                var parts = origStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
                var whole = parseInt(parts[1]), d = parseInt(parts[3]);
                var newWhole = rand(Math.max(1, whole - 3), whole + 3);
                var newN = rand(1, d - 1);
                return newWhole + ' ' + newN + '/' + d;
            } else if (/^\d+\/\d+$/.test(origStr)) {
                var fracParts = origStr.split('/').map(Number);
                var newD = rand(Math.max(2, fracParts[1] - 2), fracParts[1] + 2);
                var newNum = rand(1, newD - 1);
                return newNum + '/' + newD;
            }
            return slot.original;
        }
        case 'currency': {
            var cStep = (slot.step != null && slot.step > 0) ? slot.step : 0.01;
            var cScale = Math.round(1 / cStep);
            var cMin = Math.round(slot.min * cScale);
            var cMax = Math.round(slot.max * cScale);
            return rand(cMin, cMax) / cScale;
        }
        case 'percent': {
            var pStep = (slot.step != null && slot.step > 0) ? slot.step : 1;
            if (pStep <= 1) return rand(slot.min, slot.max);
            var pLo = Math.ceil(slot.min / pStep);
            var pHi = Math.floor(slot.max / pStep);
            if (pHi < pLo) return slot.min;
            return rand(pLo, pHi) * pStep;
        }
        case 'word-choice':
            return choose(slot.choices);
        default:
            return slot.original;
    }
}

/**
 * Generate values for all slots, resolving computed expressions and respecting
 * descriptor.constraint if present. Re-rolls independent slots up to 200 times
 * to satisfy the constraint. If the constraint can never be satisfied the last
 * rolled values are returned so the question still renders.
 */
function generateConstrainedValues(descriptor, slots) {
    var maxAttempts = 200;
    var vals;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
        vals = new Array(slots.length);
        for (var i = 0; i < slots.length; i++) {
            if (slots[i].type !== 'computed') vals[i] = generateUserSlotValue(slots[i]);
        }
        for (var j = 0; j < slots.length; j++) {
            if (slots[j].type !== 'computed') continue;
            var expr = slots[j].expression || '';
            var safeExpr = expr;
            for (var k = 0; k < slots.length; k++) {
                if (slots[k].name) {
                    safeExpr = safeExpr.replace(new RegExp('\\b' + slots[k].name + '\\b', 'g'), 'vals[' + k + ']');
                }
            }
            if (isValidExpression(safeExpr)) {
                try { vals[j] = new Function('vals', 'return ' + safeExpr)(vals); }
                catch (e) { vals[j] = 0; }
            } else { vals[j] = 0; }
        }
        if (!descriptor.constraint || !String(descriptor.constraint).trim()) return vals;
        if (evaluateConstraint(descriptor.constraint, vals, slots)) return vals;
    }
    return vals;
}

/**
 * Evaluate a constraint expression against generated values.
 * Variable names are substituted for vals[N]. Returns true on any error so
 * malformed constraints don't deadlock the generator.
 */
function evaluateConstraint(expr, vals, slots) {
    var safe = String(expr);
    for (var k = 0; k < slots.length; k++) {
        if (slots[k].name) {
            safe = safe.replace(new RegExp('\\b' + slots[k].name + '\\b', 'g'), 'vals[' + k + ']');
        }
    }
    // Allow a superset of operators used by constraints
    var stripped = safe
        .replace(/vals\[\d+\]/g, '')
        .replace(/Math\.[A-Za-z_0-9]+/g, '')
        .replace(/===|!==|==|!=|<=|>=|&&|\|\||[0-9+\-*/().,%\s<>!]/g, '');
    if (stripped.length) return true;
    try { return !!(new Function('vals', 'return (' + safe + ');')(vals)); }
    catch (e) { return true; }
}

/**
 * Rehydrate a user-defined variable descriptor into a template-compatible object.
 */
function rehydrateUserDefined(descriptor) {
    var isOE = descriptor.questionType === 'oe' || !!descriptor.openEnded;
    return {
        type: 'dynamic-user', anchor: 'Dynamic question (user-defined)', openEnded: isOE,
        gen: function() {
            var slots = descriptor.slots;
            var vals = generateConstrainedValues(descriptor, slots);

            // Fill templates with generated values
            var q = fillUserTemplate(descriptor.textTemplate, vals, slots);
            var ans = resolveAnswerText(descriptor, vals, slots);

            var distractors = [];
            if (descriptor.distractorTemplates && descriptor.distractorTemplates.length) {
                distractors = descriptor.distractorTemplates.map(function(tmpl, idx) {
                    var raw = fillUserTemplate(tmpl, vals, slots);
                    var fmt = (descriptor.distractorFormats && descriptor.distractorFormats[idx]) || descriptor.answerFormat;
                    return applyUserAnswerFormat(raw, fmt);
                }).filter(function (s) { return s && s.length; });
            }

            // Evaluate free-form distractor expressions (the "Wrong 1/2/3" inputs)
            if (distractors.length === 0 && descriptor.distractorExprs && descriptor.distractorExprs.length) {
                descriptor.distractorExprs.forEach(function (expr, dIdx) {
                    if (!expr || !String(expr).trim()) return;
                    expr = String(expr).trim();
                    var safeExpr = expr;
                    var hasVarRef = false;
                    for (var di = 0; di < slots.length; di++) {
                        if (slots[di].name && new RegExp('\\b' + slots[di].name + '\\b').test(safeExpr)) {
                            safeExpr = safeExpr.replace(new RegExp('\\b' + slots[di].name + '\\b', 'g'), 'vals[' + di + ']');
                            hasVarRef = true;
                        }
                    }
                    var fmt = (descriptor.distractorFormats && descriptor.distractorFormats[dIdx]) || descriptor.answerFormat;
                    var formatted;
                    if (hasVarRef && isValidExpression(safeExpr)) {
                        try {
                            var val = new Function('vals', 'return ' + safeExpr)(vals);
                            if (val == null) return;
                            if (typeof val === 'number' && fmt && fmt.kind && fmt.kind !== 'auto' && fmt.kind !== 'inherit') {
                                formatted = formatUserAnswerValue(val, fmt);
                            } else {
                                formatted = typeof val === 'number'
                                    ? (Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(4)).toString())
                                    : String(val);
                            }
                        } catch (e) { return; }
                    } else {
                        formatted = (fmt && fmt.kind && fmt.kind !== 'auto' && fmt.kind !== 'inherit')
                            ? applyUserAnswerFormat(expr, fmt)
                            : expr;
                    }
                    if (formatted && formatted !== ans) distractors.push(formatted);
                });
            }

            // Final fallback: auto-generate format-aware distractors so saved
            // MC questions without explicit wrong answers still render options
            // in the same format as the correct answer (fraction → fractions,
            // percent → percents, etc.).
            if (distractors.length === 0 && !descriptor.openEnded && descriptor.questionType !== 'oe') {
                distractors = autoGenerateDistractors(ans, descriptor.answerFormat, vals);
            }

            var guide = '';
            if (descriptor.guideTemplate) {
                guide = fillUserTemplate(descriptor.guideTemplate, vals, slots);
            }

            return { q: q, ans: ans, distractors: distractors, guide: guide };
        }
    };
}

/**
 * Parse a formatted answer string back into a raw numeric value. Handles
 * fractions ("3/4", "1 1/2"), currency ("$1.25"), and percent ("75%").
 * Percent strings return the 0-1 fraction (e.g. "75%" -> 0.75) so they
 * round-trip cleanly through formatUserAnswerValue(x, {kind:'percent'}).
 * Returns NaN if not parseable.
 */
function parseFormattedNumber(str) {
    if (str == null) return NaN;
    var s = String(str).trim();
    if (!s) return NaN;
    // Negative sign handling
    var sign = 1;
    if (s.charAt(0) === '-') { sign = -1; s = s.slice(1).trim(); }
    // Mixed number "1 1/2"
    var mix = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s);
    if (mix) return sign * (parseInt(mix[1]) + parseInt(mix[2]) / parseInt(mix[3]));
    // Fraction "3/4"
    var frac = /^(\d+)\/(\d+)$/.exec(s);
    if (frac) {
        var denom = parseInt(frac[2]);
        if (denom === 0) return NaN;
        return sign * parseInt(frac[1]) / denom;
    }
    var hadDollar = s.charAt(0) === '$'; if (hadDollar) s = s.slice(1);
    var hadPercent = s.charAt(s.length - 1) === '%'; if (hadPercent) s = s.slice(0, -1);
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    var n = sign * parseFloat(s);
    if (hadPercent) n = n / 100;
    return n;
}

/**
 * Generate plausible wrong-answer distractors in the same format as the
 * correct answer. Distractors are kept close to the answer via magnitude-
 * scaled multiplicative + small additive offsets (not raw operand values,
 * which for a small fraction answer would produce wildly distant numbers).
 * Returns up to 3 unique strings.
 */
function autoGenerateDistractors(ans, format, vals) {
    var ansVal = parseFormattedNumber(ans);
    if (!Number.isFinite(ansVal)) return [];
    format = format || { kind: 'auto' };
    var kind = format.kind || 'auto';
    var distractors = [];
    var seen = {}; seen[ans] = true;

    // Multiplicative near-by candidates — these scale with magnitude, so
    // "answer 1/3" and "answer 120" both get plausibly-close wrong options.
    var multiplicative = [1.1, 0.9, 1.25, 0.75, 1.5, 0.5, 1.2, 0.8, 2, 1.05, 0.95];
    var candidates = [];
    multiplicative.forEach(function (f) {
        if (Math.abs(ansVal) > 1e-12) candidates.push(ansVal * f);
    });

    // Small additive offsets appropriate to the format
    var mag = Math.max(1, Math.abs(ansVal));
    var adds;
    if (kind === 'fraction') {
        adds = [1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 8, 2 / 3, 3 / 4, 1 / 12];
    } else if (kind === 'percent') {
        adds = [0.01, 0.02, 0.05, 0.10];
    } else if (kind === 'currency' || kind === 'decimal') {
        var places = format.places != null ? format.places : 2;
        var step = Math.pow(10, -places);
        adds = [step, 10 * step, 0.1 * mag, 0.25 * mag];
    } else if (kind === 'integer' || Number.isInteger(ansVal)) {
        var r = Math.max(1, Math.round(mag * 0.1));
        adds = [1, 2, r, Math.round(r / 2) || 1, r * 2];
    } else {
        adds = [0.1 * mag, 0.25 * mag, 1, 2];
    }
    adds.forEach(function (inc) {
        candidates.push(ansVal + inc);
        candidates.push(ansVal - inc);
    });

    var allowNonPositive = kind === 'percent' || kind === 'fraction' || ansVal < 0;
    for (var ci = 0; ci < candidates.length && distractors.length < 3; ci++) {
        var cand = candidates[ci];
        if (!Number.isFinite(cand)) continue;
        if (!allowNonPositive && cand <= 0) continue;
        // For integer format, round each candidate so near-duplicates collapse
        if (kind === 'integer' || (kind === 'auto' && Number.isInteger(ansVal))) {
            cand = Math.round(cand);
            if (cand === Math.round(ansVal)) continue;
        }
        var str = formatUserAnswerValue(cand, format);
        if (!seen[str]) { seen[str] = true; distractors.push(str); }
    }

    // Jitter fallback, still magnitude-scaled so results stay near the answer
    var safety = 0;
    while (distractors.length < 3 && safety++ < 80) {
        var frac = (Math.random() * 0.4 + 0.05) * (Math.random() < 0.5 ? 1 : -1);
        var r = ansVal + mag * frac;
        if (!allowNonPositive && r <= 0) continue;
        var rStr = formatUserAnswerValue(r, format);
        if (!seen[rStr]) { seen[rStr] = true; distractors.push(rStr); }
    }

    return distractors.slice(0, 3);
}

/**
 * Apply answer format to a rendered template string. Only reformats if the
 * rendered string parses cleanly as a number (e.g. "3", "0.75", "$1.20",
 * "75%"); otherwise the original string is returned unchanged.
 */
function applyUserAnswerFormat(str, format) {
    if (!format || !format.kind || format.kind === 'auto') return str;
    var num = parseFormattedNumber(str);
    if (!Number.isFinite(num)) return str;
    return formatUserAnswerValue(num, format);
}

/**
 * Auto-detect variables in a question and return a user-defined-format descriptor, or null.
 * Wraps existing arithmetic and cosmetic heuristics into one call.
 */
function autoDetectVariables(text, answer, options, guide) {
    var answerVal = parseFloat(answer);

    // Step 1: Try arithmetic detection
    var numbers = extractNumbers(text);
    if (numbers.length >= 2 && !isNaN(answerVal)) {
        var operation = detectOperation(numbers, answerVal);
        if (operation) {
            var arithDesc = buildDescriptor(text, numbers, operation, answerVal);
            if (arithDesc) {
                return convertArithmeticToUserDefined(arithDesc, answer, options || [], guide || '');
            }
        }
    }

    // Step 2: Fallback to cosmetic detection
    var cosmeticDesc = buildCosmeticDescriptor(text, answer, options || []);
    if (cosmeticDesc) {
        return convertCosmeticToUserDefined(cosmeticDesc, guide || '');
    }

    // Step 3: Nothing detected
    return null;
}

/**
 * Convert an arithmetic descriptor into user-defined format.
 */
function convertArithmeticToUserDefined(arithDesc, answer, options, guide) {
    var slots = arithDesc.slots.map(function(s) {
        var type = 'integer';
        if (s.isCurrency) type = 'currency';
        else if (s.isDecimal) type = 'decimal';
        return {
            index: s.index,
            type: type,
            original: String(s.original),
            min: s.min,
            max: s.max
        };
    });

    // Build expression for the computed answer slot
    var ops = arithDesc.operation.operands;
    var expression = '';
    switch (arithDesc.operation.type) {
        case 'add': expression = 'vals[' + ops[0] + '] + vals[' + ops[1] + ']'; break;
        case 'subtract': expression = 'vals[' + ops[0] + '] - vals[' + ops[1] + ']'; break;
        case 'multiply': expression = 'vals[' + ops[0] + '] * vals[' + ops[1] + ']'; break;
        case 'divide': expression = 'vals[' + ops[0] + '] / vals[' + ops[1] + ']'; break;
        case 'add3': expression = 'vals[' + ops[0] + '] + vals[' + ops[1] + '] + vals[' + ops[2] + ']'; break;
        case 'multiply3': expression = 'vals[' + ops[0] + '] * vals[' + ops[1] + '] * vals[' + ops[2] + ']'; break;
        case 'multiply_add': expression = 'vals[' + ops[0] + '] * vals[' + ops[1] + '] + vals[' + ops[2] + ']'; break;
        case 'multiply_subtract': expression = 'vals[' + ops[0] + '] * vals[' + ops[1] + '] - vals[' + ops[2] + ']'; break;
        case 'add_multiply': expression = '(vals[' + ops[0] + '] + vals[' + ops[1] + ']) * vals[' + ops[2] + ']'; break;
        default: expression = '0';
    }

    // Answer slot
    var answerSlotIndex = slots.length;
    slots.push({
        index: answerSlotIndex,
        type: 'computed',
        expression: expression,
        original: answer
    });

    // Distractor slots — generate offsets from the answer
    var distractorTemplates = [];
    var distractorOffsets = [
        'vals[' + ops[0] + '] + vals[' + ops[1] + ']',
        'vals[' + answerSlotIndex + '] + vals[' + ops[0] + ']',
        'vals[' + answerSlotIndex + '] - vals[' + ops[1] + ']'
    ];
    // Use simpler distractor expressions based on operation type
    switch (arithDesc.operation.type) {
        case 'add':
            distractorOffsets = [
                'vals[' + ops[0] + '] * vals[' + ops[1] + ']',
                'vals[' + answerSlotIndex + '] + 1',
                'Math.abs(vals[' + ops[0] + '] - vals[' + ops[1] + '])'
            ];
            break;
        case 'subtract':
            distractorOffsets = [
                'vals[' + ops[0] + '] + vals[' + ops[1] + ']',
                'vals[' + answerSlotIndex + '] + 1',
                'vals[' + ops[1] + '] - vals[' + ops[0] + ']'
            ];
            break;
        case 'multiply': case 'multiply3':
            distractorOffsets = [
                'vals[' + ops[0] + '] + vals[' + ops[1] + ']',
                'vals[' + answerSlotIndex + '] + vals[' + ops[0] + ']',
                'vals[' + answerSlotIndex + '] - vals[' + ops[1] + ']'
            ];
            break;
        case 'divide':
            distractorOffsets = [
                'vals[' + ops[0] + '] * vals[' + ops[1] + ']',
                'vals[' + ops[0] + '] - vals[' + ops[1] + ']',
                'vals[' + answerSlotIndex + '] + 1'
            ];
            break;
    }

    for (var d = 0; d < 3; d++) {
        var dSlotIndex = slots.length;
        slots.push({
            index: dSlotIndex,
            type: 'computed',
            expression: distractorOffsets[d] || ('vals[' + answerSlotIndex + '] + ' + (d + 1)),
            original: '0'
        });
        distractorTemplates.push('{' + dSlotIndex + '}');
    }

    // Build answer format template
    var ansTemplate = '{' + answerSlotIndex + '}';
    if (arithDesc.answerFormat === 'currency') {
        ansTemplate = '${' + answerSlotIndex + '}';
    }

    // Build guide template from operation
    var sym = { multiply: '*', add: '+', subtract: '-', divide: '/' };
    var guideTemplate = guide || '';
    if (!guideTemplate) {
        var opSym = sym[arithDesc.operation.type] || '?';
        guideTemplate = '{' + ops[0] + '} ' + opSym + ' {' + ops[1] + '} = {' + answerSlotIndex + '}';
    }

    return {
        textTemplate: arithDesc.textTemplate,
        answerTemplate: ansTemplate,
        distractorTemplates: distractorTemplates,
        guideTemplate: guideTemplate,
        slots: slots,
        operation: { type: 'user-defined' },
        openEnded: false
    };
}

/**
 * Convert a cosmetic descriptor into user-defined format.
 */
function convertCosmeticToUserDefined(cosmeticDesc, guide) {
    var slots = cosmeticDesc.tokens.map(function(tok, i) {
        var type = 'integer';
        var min, max;

        if (/^\d+\s+\d+\/\d+$/.test(tok) || /^\d+\/\d+$/.test(tok)) {
            type = 'fraction';
            min = 0; max = 0; // not used for fraction type
        } else if (/^\d+%$/.test(tok)) {
            type = 'percent';
            var pv = parseInt(tok);
            min = Math.max(10, pv - 15);
            max = Math.min(99, pv + 15);
        } else if (/^\d+\.\d+$/.test(tok)) {
            type = 'decimal';
            var dv = parseFloat(tok);
            var range = computeRange(dv);
            min = range.min;
            max = range.max;
        } else if (/^\d{1,3}(,\d{3})+$/.test(tok)) {
            type = 'integer';
            var cv = parseInt(tok.replace(/,/g, ''));
            min = Math.floor(cv * 0.7);
            max = Math.ceil(cv * 1.3);
        } else if (/^-?\d+$/.test(tok)) {
            type = 'integer';
            var iv = Math.abs(parseInt(tok));
            var iRange = computeRange(iv);
            min = iRange.min;
            max = iRange.max;
        } else {
            min = 1; max = 10;
        }

        return {
            index: i,
            type: type,
            original: tok,
            min: min,
            max: max
        };
    });

    // The cosmetic descriptor already has answer and option templates
    var distractorTemplates = [];
    if (cosmeticDesc.optionTemplates) {
        // The first few option templates that differ from answerTemplate are distractors
        for (var k = 0; k < cosmeticDesc.optionTemplates.length; k++) {
            if (cosmeticDesc.optionTemplates[k] !== cosmeticDesc.answerTemplate) {
                distractorTemplates.push(cosmeticDesc.optionTemplates[k]);
            }
        }
        distractorTemplates = distractorTemplates.slice(0, 3);
    }

    return {
        textTemplate: cosmeticDesc.textTemplate,
        answerTemplate: cosmeticDesc.answerTemplate,
        distractorTemplates: distractorTemplates,
        guideTemplate: guide || 'The correct answer is: ' + cosmeticDesc.answerTemplate,
        slots: slots,
        operation: { type: 'user-defined' },
        openEnded: false
    };
}
