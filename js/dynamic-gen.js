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
