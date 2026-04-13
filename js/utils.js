const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

/**
 * Remove duplicate choices while keeping the correct answer
 * Returns an array with unique choices, starting with the correct answer
 */
function getUniqueChoices(correctAnswer, distractors, maxChoices = 4) {
    // Ensure all values are strings
    const uniqueChoices = [String(correctAnswer)];

    // Add distractors that are not already in the list
    for (const distractor of distractors) {
        const d = String(distractor);
        if (!uniqueChoices.includes(d) && uniqueChoices.length < maxChoices) {
            uniqueChoices.push(d);
        }
    }

    return uniqueChoices;
}

// ========== FORMATTING UTILITIES ==========

/**
 * Format a term with its coefficient and sign properly
 * Examples: formatTerm(3, 'x') => '3x', formatTerm(-2, 'x') => '-2x'
 */
function formatTerm(coeff, variable = '') {
    if (coeff === 0) return '0';
    const sign = coeff > 0 ? '' : '-';
    const absCoeff = Math.abs(coeff);
    return absCoeff === 1 && variable ? `${sign}${variable}` : `${sign}${absCoeff}${variable}`;
}

/**
 * Format a polynomial with proper signs (no x + -3, instead x - 3)
 * Examples: formatPoly(2, -5, 6) => '2x - 5x + 6', formatPoly(1, -3) => 'x - 3'
 */
function formatPoly(...coeffs) {
    const terms = [];
    const vars = ['x<sup>2</sup>', 'x', ''];
    
    for (let i = 0; i < coeffs.length; i++) {
        const c = coeffs[i];
        if (c === 0 && i < coeffs.length - 1) continue; // Skip zero middle terms
        
        const variable = vars[i] || '';
        const term = formatTerm(c, variable);
        
        if (terms.length === 0) {
            terms.push(term);
        } else {
            // Add proper sign
            if (term.startsWith('-')) {
                terms.push('- ' + term.substring(1));
            } else {
                terms.push('+ ' + term);
            }
        }
    }
    
    return terms.join(' ') || '0';
}

/**
 * Convert exponent notation: 2^3 becomes 2<sup>3</sup>
 */
function formatExponent(base, exp) {
    return `${base}<sup>${exp}</sup>`;
}

/**
 * Format equation with proper signs: y = x + -3 becomes y = x - 3
 */
function formatEquation(slope, intercept) {
    if (intercept === 0) return `y = ${slope === 1 ? '' : slope}x`;
    const sign = intercept > 0 ? '+' : '-';
    const absInt = Math.abs(intercept);
    const slopeStr = slope === 1 ? 'x' : slope === -1 ? '-x' : slope + 'x';
    return `y = ${slopeStr} ${sign} ${absInt}`;
}

/**
 * Format linear equation: solution from ax + b = c
 */
function formatLinearSolution(a, b, result) {
    const step1 = result - b;
    return `${a}x = ${result} - ${b}\n${a}x = ${step1}\nx = ${step1} ÷ ${a} = ${result}`;
}

/**
 * Format fractions as stacked HTML fractions
 * Renders as a proper vertical fraction with numerator over denominator
 */
function formatFraction(num, denom) {
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${denom}</span></span>`;
}

/**
 * Format factored expression properly with variables
 * Example: formatFactored(4, [3, 1], ['x', 'y']) => "4(3x + y)"
 */
function formatFactored(gcd, coefficients, variables) {
    if (!Array.isArray(coefficients) || !Array.isArray(variables)) {
        return `${gcd}(...)`; // fallback
    }
    
    const terms = [];
    for (let i = 0; i < coefficients.length; i++) {
        const coeff = coefficients[i];
        const variable = variables[i] || '';
        
        if (coeff === 0) continue;
        
        const term = coeff === 1 && variable ? variable : 
                     coeff === -1 && variable ? `-${variable}` : 
                     `${coeff}${variable}`;
        
        if (terms.length === 0) {
            terms.push(term);
        } else {
            if (coeff > 0) {
                terms.push(`+ ${term}`);
            } else {
                terms.push(`- ${term.startsWith('-') ? term.substring(1) : term}`);
            }
        }
    }
    
    return `${gcd}(${terms.join(' ')})`;
}

/**
 * ========== INTELLIGENT PROBLEM GENERATION ==========
 * Pattern-based generators using real-world contexts like PSSA problems
 */

// Real-world contexts for Grade 3-5 problems
const ProblemContexts = {
    shopping: {
        items: ['apples', 'books', 'pencils', 'notebooks', 'erasers', 'markers'],
        stores: ['school store', 'market', 'bookstore', 'art supply store'],
        currencies: ['$']
    },
    measurement: {
        objects: ['a rope', 'a board', 'a ribbon', 'a garden', 'a field'],
        units: { length: ['feet', 'inches', 'yards'], weight: ['pounds', 'ounces'], volume: ['cups', 'gallons'] }
    },
    collection: {
        items: ['cards', 'stickers', 'coins', 'marbles', 'beads', 'stamps'],
        actions: ['collected', 'gave away', 'lost', 'found', 'traded']
    },
    time: {
        activities: ['playing', 'reading', 'homework', 'lunch', 'recess', 'class'],
        formats: ['minutes', 'hours']
    }
};

/**
 * Select numbers intelligently based on pedagogical value
 * Avoids trivial answers and ensures meaningful problem difficulty
 */
function selectSmartNumbers(range, opts = {}) {
    const { min = range[0], max = range[1], avoid = [], favorTypes = [] } = opts;
    let num;
    do {
        num = rand(min, max);
    } while (avoid.includes(num));
    return num;
}

/**
 * Generate context-based distractors (common misconceptions)
 */
function generateIntelligentDistracters(correct, problemType, context = {}) {
    const correct_num = typeof correct === 'string' ? parseInt(correct) : correct;
    const distractors = [];
    
    // Common mistake: off-by-one
    if (!distractors.includes(correct_num + 1)) {
        distractors.push((correct_num + 1).toString());
    }
    
    // Common mistake: operations in wrong order
    if (context.a && context.b) {
        const reversed = (context.b + context.a).toString();
        if (reversed !== correct && !distractors.includes(reversed)) {
            distractors.push(reversed);
        }
    }
    
    // Common mistake: forgot a step (e.g., partial calculation)
    if (context.intermediate) {
        if (!distractors.includes(context.intermediate.toString())) {
            distractors.push(context.intermediate.toString());
        }
    }
    
    // Random plausible wrong answer
    if (distractors.length < 3) {
        const wrongAnswer = (correct_num + rand(2, 10)).toString();
        if (!distractors.includes(wrongAnswer)) {
            distractors.push(wrongAnswer);
        }
    }
    
    return distractors.slice(0, 3);
}

/**
 * Select random item from array
 */
function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateSessionId() {
    return 'SESS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function drawCartesianGrid(ctx, width, height, step) {
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// ========== EQUATION PARSING & GRAPHING ==========

function parseEquation(eqStr) {
    let s = eqStr.replace(/\s+/g, '').toLowerCase();
    if (s.startsWith('y=')) s = s.substring(2);
    else if (s.startsWith('f(x)=')) s = s.substring(5);

    function coeff(c) {
        if (!c || c === '+' || c === '') return 1;
        if (c === '-') return -1;
        return parseFloat(c);
    }

    // Constant
    if (/^[+-]?\d+\.?\d*$/.test(s)) {
        const c = parseFloat(s);
        return { type: 'constant', eval: x => c, label: eqStr };
    }

    // Quadratic: ax^2 + bx + c (with optional terms)
    const qm = s.match(/^([+-]?\d*\.?\d*)x\^2(?:([+-]\d*\.?\d*)x)?(?:([+-]\d+\.?\d*))?$/);
    if (qm) {
        const a = coeff(qm[1]), b = qm[2] ? coeff(qm[2]) : 0, c = qm[3] ? parseFloat(qm[3]) : 0;
        return { type: 'quadratic', eval: x => a*x*x + b*x + c, label: eqStr };
    }

    // Absolute value: a|x - h| + k
    const absM = s.match(/^([+-]?\d*\.?\d*)\|x([+-]\d*\.?\d*)\|(?:([+-]\d+\.?\d*))?$/);
    if (absM) {
        const a = coeff(absM[1]), h = absM[2] ? parseFloat(absM[2]) : 0, k = absM[3] ? parseFloat(absM[3]) : 0;
        return { type: 'absolute', eval: x => a * Math.abs(x + h) + k, label: eqStr };
    }

    // Square root: a*sqrt(x - h) + k
    const sqrtM = s.match(/^([+-]?\d*\.?\d*)sqrt\(x(?:([+-]\d*\.?\d*))?\)(?:([+-]\d+\.?\d*))?$/);
    if (sqrtM) {
        const a = coeff(sqrtM[1]), h = sqrtM[2] ? parseFloat(sqrtM[2]) : 0, k = sqrtM[3] ? parseFloat(sqrtM[3]) : 0;
        return { type: 'sqrt', eval: x => (x + h >= 0) ? a * Math.sqrt(x + h) + k : NaN, label: eqStr };
    }

    // Linear: mx + b (must be after quadratic check)
    const lm = s.match(/^([+-]?\d*\.?\d*)x(?:([+-]\d+\.?\d*))?$/);
    if (lm) {
        const m = coeff(lm[1]), b = lm[2] ? parseFloat(lm[2]) : 0;
        return { type: 'linear', eval: x => m*x + b, label: eqStr };
    }

    // Just "x"
    if (s === 'x') return { type: 'linear', eval: x => x, label: eqStr };

    return null;
}

function renderEquationGraph(canvas, ctx, eqStr) {
    const size = 300;
    const step = 30;
    const cx = size / 2, cy = size / 2;

    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Grid
    drawCartesianGrid(ctx, size, size, step);

    // Axes
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();

    // Axis numbers
    ctx.fillStyle = '#6c757d';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        ctx.fillText(i, cx + i * step, cy + 12);
    }
    ctx.textAlign = 'right';
    for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        ctx.fillText(i, cx - 5, cy - i * step + 3);
    }

    // Plot
    const parsed = parseEquation(eqStr);
    if (!parsed) {
        ctx.fillStyle = '#721c24';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Could not parse: ' + eqStr, 8, 16);
        return;
    }

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px < size; px++) {
        const x = (px - cx) / step;
        const y = parsed.eval(x);
        if (isNaN(y) || !isFinite(y)) { started = false; continue; }
        const py = cy - y * step;
        if (py < -100 || py > size + 100) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Equation label
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(eqStr.trim(), 8, 16);
}

/**
 * Normalize mathematical expressions for answer comparison
 * Handles: removing spaces, normalizing symbols, handling common variations
 * Example: "2.50" and "2.5" both normalize to the same value
 */
function normalizeAnswer(answer) {
    // Remove all whitespace
    let normalized = answer.replace(/\s/g, '');
    
    // Convert to lowercase for comparison
    normalized = normalized.toLowerCase();
    
    // Try to parse as a number to handle decimal variations
    // If it's a pure number, parse it and convert back to remove trailing zeros
    if (/^-?\d+(\.\d+)?$/.test(normalized)) {
        const num = parseFloat(normalized);
        normalized = num.toString();
    }
    
    return normalized;
}

/**
 * Auto-format math notation in HTML strings:
 * - Plain fractions like 3/4 become stacked fractions
 * - Caret exponents like x^2 become superscripts
 */
function renderMathInHTML(html) {
    // Convert cube roots: ∛expression → radical with overline and ³ prefix
    html = html.replace(/∛(\d+)/g, function(m, radicand) {
        return '<sup>3</sup><span class="msqrt"><span class="msqrt-inner">' + radicand + '</span></span>';
    });

    // Convert square roots: √expression → proper radical with overline
    // Handle parenthesized: √(expr)
    html = html.replace(/(\d*)√\(([^)]+)\)/g, function(m, coeff, inner) {
        return (coeff || '') + '<span class="msqrt"><span class="msqrt-inner">' + inner + '</span></span>';
    });
    // Handle: coefficient√number or √number (no parens)
    html = html.replace(/(\d*)√(\d+)/g, function(m, coeff, radicand) {
        return (coeff || '') + '<span class="msqrt"><span class="msqrt-inner">' + radicand + '</span></span>';
    });

    // Convert Unicode superscripts: ² → <sup>2</sup>, ³ → <sup>3</sup> (when not already in a tag)
    html = html.replace(/²/g, '<sup>2</sup>');
    html = html.replace(/³/g, '<sup>3</sup>');

    // Convert caret exponents: x^2, 10^3, x^-2, x^{12}, (base)^exp, etc.
    // Handle braced/parenthesized exponents: x^{12} or x^(-1)
    html = html.replace(/([\w\)])\^\{([^}]+)\}/g, '$1<sup>$2</sup>');
    html = html.replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>');
    // Handle plain exponents: 10^23, x^-2, x^3
    html = html.replace(/\^(-?\w+)/g, '<sup>$1</sup>');

    // Convert plain fractions like 3/4 but NOT inside URLs or HTML tags
    // Match: optional whole number + fraction like 2 1/3, or standalone 3/4
    html = html.replace(/(?<![<\w\/])(\d+)\s+(\d+)\s*\/\s*(\d+)(?![>\w])/g, function(m, whole, num, den) {
        return `${whole} <span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
    });
    html = html.replace(/(?<![<\w\/])(\d+)\s*\/\s*(\d+)(?![>\w])/g, function(m, num, den) {
        return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
    });

    return html;
}
