/**
 * PSSA Problem Pattern Library
 * Extracted from official PSSA Grade 3 Math samples
 * These define problem STRUCTURE (not specific content)
 * AI will generate unique variations
 */

const PSSSAPatterns = {
    // A-T: Numbers and Operations in Base Ten
    "A-T.1.1": {
        name: "Numbers and Operations - Base Ten",
        examples: [
            "Identify multi-digit numbers",
            "Understand place value (hundreds, tens, ones)",
            "Compare 3-digit numbers"
        ],
        structure: {
            type: "multi-digit-operations",
            numbers: "2-3 digit numbers",
            operations: ["compare", "identify place value", "round"],
            format: "multiple-choice or identify"
        }
    },

    // A-F: Numbers and Operations - Fractions
    "A-F.1.1": {
        name: "Fractions - Parts of a Whole",
        examples: [
            "A circle is divided into pieces. What fraction represents one piece?",
            "Compare fractions with same denominator",
            "Understand unit fractions"
        ],
        structure: {
            type: "fractions",
            objects: ["pizza", "pie", "circle", "rectangle", "garden", "cake"],
            operations: ["divide into parts", "identify fraction", "compare"],
            denominators: [2, 3, 4, 6, 8],
            format: "identify or compare"
        },
        variationGuide: `
        Pick random: [object] divided into [number] equal pieces
        Student sees [X] pieces out of [total]
        Answer: [X]/[total] as fraction
        `
    },

    // B-O: Operations and Algebraic Thinking
    "B-O.1.2.1": {
        name: "Multiplication as Arrays and Groups",
        examples: [
            "3 groups of 4 items = 12 total",
            "Array of 5 rows and 3 columns",
            "Skip counting patterns"
        ],
        structure: {
            type: "multiplication-arrays",
            items: ["stars", "apples", "flowers", "books", "chairs"],
            groups: "2-9",
            format: "word problem or visual"
        }
    },

    "B-O.2.1.1": {
        name: "Properties of Operations",
        examples: [
            "Commutative property (3+5 = 5+3)",
            "Associative property of multiplication",
            "Distributive property"
        ],
        structure: {
            type: "properties-operations",
            operation: ["addition", "multiplication"],
            range: "1-20 for addition, 1-10 for multiplication"
        }
    },

    "B-O.3.1.1": {
        name: "Multi-Step Word Problems",
        examples: [
            "Start with X, add Y, subtract Z",
            "Start with X apples, buy Y, use Z",
            "Combine multiple operations"
        ],
        structure: {
            type: "multi-step-word",
            context: ["shopping", "collecting items", "sharing food", "organizing"],
            operations: 2,
            range: "numbers 10-100"
        }
    },

    // C-G: Geometry
    "C-G.1": {
        name: "Shapes and Their Attributes",
        examples: [
            "Identify polygons vs non-polygons",
            "Compare properties (sides, angles, closed shapes)",
            "Sort shapes by attributes"
        ],
        structure: {
            type: "shape-properties",
            shapes: ["triangle", "square", "rectangle", "circle", "pentagon"],
            properties: ["number of sides", "number of angles", "open/closed", "straight/curved"],
            task: ["identify", "compare", "explain difference"],
            format: "open-ended with explanation"
        },
        exampleTask: `
        Part A: "What fraction of the shape is shaded?" (numeric answer)
        Part B: "Why is one piece smaller?" (explanation)
        Part C: "What do circles and triangles have in common?" (explanation)
        Part D: "How are they different?" (explanation)
        `
    },

    // D-M: Measurement and Data
    "D-M.1.1.1": {
        name: "Length and Linear Measurement",
        examples: [
            "Measure objects in inches/centimeters",
            "Estimate and measure length",
            "Compare lengths of objects"
        ],
        structure: {
            type: "measurement-length",
            objects: ["pencil", "rope", "book", "table", "desk"],
            units: ["inches", "centimeters", "feet"],
            range: "1-100 units"
        }
    },

    "D-M.1.2.3": {
        name: "Time - Telling and Reading",
        examples: [
            "Read time from analog/digital clock",
            "Calculate elapsed time",
            "Compare times"
        ],
        structure: {
            type: "time",
            format: ["analog", "digital"],
            operations: ["read time", "elapsed time", "compare"]
        }
    },

    "D-M.4.1.1": {
        name: "Interpreting Data and Graphs",
        examples: [
            "Read bar graphs",
            "Read picture graphs (with key)",
            "Interpret data and answer questions"
        ],
        structure: {
            type: "data-interpretation",
            graphTypes: ["bar graph", "picture graph", "tally chart"],
            categories: ["sports", "pets", "colors", "favorite activities"],
            range: "0-30 items"
        }
    }
};

/**
 * Get a random PSSA pattern for a skill
 */
function getRandomPSSAPattern(skillCode) {
    return PSSSAPatterns[skillCode] || PSSSAPatterns["B-O.3.1.1"]; // default to multi-step
}

/**
 * Get all available PSSA skills
 */
function getPSSASkills() {
    return Object.keys(PSSSAPatterns);
}

/**
 * Get skill name by code
 */
function getPSSASkillName(skillCode) {
    const pattern = PSSSAPatterns[skillCode];
    return pattern ? pattern.name : "General Math";
}
