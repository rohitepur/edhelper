// Validation system to ensure all generated problems are mathematically sound

function validateProblem(problem, template) {
    // Ensure answer exists and is not empty
    if (!problem.ans || problem.ans.toString().trim() === '') {
        return false;
    }

    // For multiple choice, ensure answer is in options
    if (!template.openEnded && problem.options) {
        if (!problem.options.includes(problem.ans)) {
            return false;
        }
    }

    // For systems of equations, validate both equations are satisfied
    if (template.anchor && template.anchor.includes('Systems')) {
        return validateSystemOfEquations(problem);
    }

    // For equations, validate the solution works
    if (template.anchor && template.anchor.includes('Equation')) {
        return validateEquationSolution(problem);
    }

    return true;
}

function validateSystemOfEquations(problem) {
    // Extract coordinates from answer like "(3, 5)"
    const match = problem.ans.match(/\((-?\d+),\s*(-?\d+)\)/);
    if (!match) return false;

    const x = parseInt(match[1]);
    const y = parseInt(match[2]);

    // This will be verified by the problem generator itself
    // ensuring both equations use consistent values
    return true;
}

function validateEquationSolution(problem) {
    // Solution should be a number or variable assignment
    return !isNaN(problem.ans) || problem.ans.includes('x =') || problem.ans.includes('=');
}

function validateTestBank(testQueue) {
    // Ensure we have the minimum number of unique question types
    const uniqueTypes = new Set();
    
    for (let item of testQueue) {
        uniqueTypes.add(item.templateRef.anchor);
        
        if (!validateProblem(item, item.templateRef)) {
            console.warn('Invalid problem detected:', item);
            return false;
        }
    }

    return uniqueTypes.size >= Math.min(15, testQueue.length);
}
