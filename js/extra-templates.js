/**
 * PSSA DYNAMIC ENGINE
 * All numerical problems are randomized and computed.
 * Guide uses template literals to show step-by-step logic with the generated numbers.
 */

// Helper: Convert two-digit numbers to words for Word Form questions
function numberToWord(n) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
                  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
                  "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    if (n < 20) return ones[n];
    if (n % 10 === 0) return tens[Math.floor(n / 10)];
    return tens[Math.floor(n / 10)] + "-" + ones[n % 10];
}

const extraTemplates = {
    pssa: {
        3: [
            { type: "Rounding", anchor: "Round whole numbers to the nearest 10 or 100.", openEnded: false, gen: () => {
                const num = rand(101, 4999); const target = rand(0, 1) ? 10 : 100;
                const ans = target === 10 ? Math.round(num/10)*10 : Math.round(num/100)*100;
                return {
                    q: `Round ${num} to the nearest ${target}.`,
                    ans: ans.toString(),
                    distractors: [(ans+target).toString(), (ans-target).toString(), (num < 500 ? ans+100 : ans-10).toString()],
                    guide: `Look at the digit to the right of the ${target}s place. Since it is ${Math.floor((num % target) / (target/10))}, you round ${num % target >= target/2 ? 'up' : 'down'}.`
                };
            }},
            { type: "Mult 10s", anchor: "Multiply 1-digit numbers by multiples of 10.", openEnded: false, gen: () => {
                const a = rand(2, 12); const bBase = rand(2, 12); const b = bBase * 10; const ans = a * b;
                return {
                    q: `James makes ${b} bookmarks. He uses ${a} inches of ribbon for each. How many inches does he use in total?`,
                    ans: ans.toString(),
                    distractors: [(a + b).toString(), (a * bBase).toString(), (ans + 10).toString()],
                    guide: `Multiply ${a} × ${bBase} = ${a*bBase}. Then append the zero from the 10s place to get ${ans}.`
                };
            }},
            { type: "Comparison", anchor: "Compare two four-digit numbers.", openEnded: false, gen: () => {
                const low = rand(1100, 4500); const high = rand(low + 1000, 9900); const mid = rand(low + 100, high - 100);
                return {
                    q: `Winner: ${high} points. 3rd Place: ${low} points. How many points could 2nd place have?`,
                    ans: mid.toString(),
                    distractors: [(low - 50).toString(), (high + 50).toString(), (high + 100).toString()],
                    guide: `The answer must be greater than ${low} and less than ${high}. ${mid} is the only value that fits.`
                };
            }},
            { type: "Fraction ID", anchor: "Identify fractions on a number line.", openEnded: false, gen: () => {
                const d = rand(2, 12);
                return { q: `A number line from 0 to 1 is divided into ${d} equal parts. What does the first mark represent?`, ans: `1/${d}`, distractors: [`1/2`, `${d}/1`, `2/${d}`], guide: `One part out of ${d} total parts is 1/${d}.` };
            }},
            { type: "Equivalent Fractions", anchor: "Recognize simple equivalent fractions.", openEnded: false, gen: () => {
                const n = rand(1, 5); const d = rand(n + 1, 10); const s = rand(2, 5);
                return { q: `Which fraction is equivalent to ${n}/${d}?`, ans: `${n*s}/${d*s}`, distractors: [`${n}/${d+1}`, `${n+1}/${d}`, `${d}/${n}`], guide: `Multiply both numerator and denominator by ${s}: (${n}×${s})/(${d}×${s}) = ${n*s}/${d*s}.` };
            }},
            { type: "Whole Frac", anchor: "Express whole numbers as fractions.", openEnded: false, gen: () => {
                const w = rand(2, 20);
                return { q: `How do you write the whole number ${w} as a fraction?`, ans: `${w}/1`, distractors: [`1/${w}`, `${w}/${w}`, `${w*2}/1`], guide: `Any whole number ${w} can be written as ${w}/1.` };
            }},
            { type: "Division Exp", anchor: "Interpret whole-number quotients.", openEnded: false, gen: () => {
                const each = rand(3, 12); const groups = rand(3, 10); const total = each * groups;
                return { q: `Share ${total} items into groups of ${each}. Which expression shows the number of groups?`, ans: `${total} ÷ ${each}`, distractors: [`${total} × ${each}`, `${total} - ${each}`, `${total} + ${each}`], guide: `To find the number of equal groups, divide the total (${total}) by the size of each group (${each}).` };
            }},
            { type: "Prop Strategy", anchor: "Apply properties to multiply/divide.", openEnded: false, gen: () => {
                const a = rand(2, 9); const b = rand(3, 12); const c = rand(2, 8);
                return { q: `Find ${a} × (${b} × ${c}) using the associative property.`, ans: `(${a} × ${b}) × ${c}`, distractors: [`${a} + (${b} × ${c})`, `(${a} × ${b}) + ${c}`, `${a*b*c} + 0`], guide: `The associative property states you can change the grouping: a(bc) = (ab)c.` };
            }},
            { type: "Partition", anchor: "Partition shapes into equal areas.", openEnded: false, gen: () => {
                const parts = rand(2, 16);
                return { q: `A shape is divided into ${parts} equal parts. Each part is what fraction of the total area?`, ans: `1/${parts}`, distractors: [`1/2`, `${parts}/1`, `2/${parts}`], guide: `When a whole is divided into ${parts} equal parts, each part is 1/${parts}.` };
            }},
            { type: "Polygons", anchor: "Understand shape attributes.", openEnded: false, gen: () => {
                return { q: `What do all squares and rectangles always have in common?`, ans: `4 right angles`, distractors: [`4 equal sides`, `exactly 3 sides`, `no parallel sides`], guide: `By definition, both rectangles and squares must have four 90-degree angles.` };
            }},
            { type: "Volume Est", anchor: "Estimate liquid volumes.", openEnded: false, gen: () => {
                const val = rand(4, 16);
                return { q: `What is the best estimate for the amount of juice in a standard breakfast glass?`, ans: `${val} ounces`, distractors: [`${val} gallons`, `${val} liters`, `${val*10} cups`], guide: `A normal glass of juice is measured in fluid ounces. Gallons and liters are much too large.` };
            }},
            { type: "Money", anchor: "Solve problems with coins/bills.", openEnded: false, gen: () => {
                const paid = choose([500, 1000, 2000]); const cost = rand(50, paid - 50); const diff = paid - cost;
                return { q: `An item costs $${(cost/100).toFixed(2)}. You pay with a $${(paid/100).toFixed(0)} bill. How much change do you receive?`, ans: `$${(diff/100).toFixed(2)}`, distractors: [`$${((diff+10)/100).toFixed(2)}`, `$${((diff-5)/100).toFixed(2)}`, `$${(cost/100).toFixed(2)}`], guide: `Subtract the cost from the amount paid: $${(paid/100).toFixed(2)} - $${(cost/100).toFixed(2)} = $${(diff/100).toFixed(2)}.` };
            }},
            { type: "Time", anchor: "Tell and write time to nearest minute.", openEnded: false, gen: () => {
                const h = rand(1, 12); const m = rand(11, 59);
                return { q: `The clock shows the hour hand just past ${h} and the minute hand on ${m}. What time is it?`, ans: `${h}:${m}`, distractors: [`${m}:${h}`, `${h}:00`, `${h+1}:${m-10}`], guide: `The hour is ${h} and the minutes are ${m}, so it is ${h}:${m}.` };
            }},
            { type: "Area Mult", anchor: "Relate area to multiplication.", openEnded: false, gen: () => {
                const l = rand(4, 25); const w = rand(3, 15); const ans = l * w;
                return { q: `A rectangular rug is ${l} feet long and ${w} feet wide. What is the area?`, ans: ans.toString(), distractors: [(l+w).toString(), (2*l+2*w).toString(), (ans-1).toString()], guide: `Area = length × width. ${l} × ${w} = ${ans} square feet.` };
            }},
            { type: "Perimeter", anchor: "Solve problems with perimeter.", openEnded: false, gen: () => {
                const s = rand(3, 30); const ans = s * 4;
                return { q: `A square garden has a side length of ${s} yards. What is the perimeter?`, ans: ans.toString(), distractors: [(s*s).toString(), (s+4).toString(), (s*2).toString()], guide: `Perimeter of a square = 4 × side. 4 × ${s} = ${ans} yards.` };
            }},
            { type: "Data Plots", anchor: "Interpret line plots.", openEnded: false, gen: () => {
                const xCount = rand(2, 12); const val = rand(1, 10);
                return { q: `On a line plot, there are ${xCount} 'X' marks above the number ${val}. How many items measured ${val} inches?`, ans: xCount.toString(), distractors: [val.toString(), (xCount+val).toString(), "1"], guide: `Each 'X' represents one item. Since there are ${xCount} Xs, there are ${xCount} items.` };
            }},
            { type: "UnknownFactor", anchor: "B-O.1.2.2", openEnded: false, gen: () => {
                const a = rand(2, 12); const ans = rand(2, 12); const product = a * ans;
                return { q: `? × ${a} = ${product}. What is the missing number?`, ans: ans.toString(), distractors: [(ans + 1).toString(), (ans - 1).toString(), a.toString()], guide: `To find the missing factor, divide the product by the known factor: ${product} ÷ ${a} = ${ans}.` };
            }},
            { type: "BikeFrac", anchor: "A-F.1.1.1", openEnded: false, gen: () => {
                const t = rand(4, 20); const p = rand(1, t - 1);
                return { q: `You rode your bike ${t} miles total and stopped at mile ${p}. What fraction of the trip had you completed when you stopped?`, ans: `${p}/${t}`, distractors: [`${t}/${p}`, `1/${t}`, `${p + 1}/${t}`], guide: `You completed ${p} miles out of ${t} total miles, so the fraction is ${p}/${t}.` };
            }},
            { type: "ArrayDiv", anchor: "B-O.1.1.2", openEnded: false, gen: () => {
                const rows = rand(2, 10); const perRow = rand(3, 12); const total = rows * perRow;
                return { q: `There are ${total} items arranged equally in ${rows} rows. How many items are in each row?`, ans: perRow.toString(), distractors: [rows.toString(), total.toString(), (perRow + 1).toString()], guide: `Divide the total by the number of rows: ${total} ÷ ${rows} = ${perRow}.` };
            }},
            { type: "RepeatAdd", anchor: "B-O.1.1.1", openEnded: false, gen: () => {
                const a = rand(2, 15); const ans = a * 4;
                return { q: `${a} + ${a} + ${a} + ${a} = ? Write this as a multiplication expression and solve.`, ans: `${a} × 4 = ${ans}`, distractors: [`${a} + 4 = ${a + 4}`, `${a} × ${a} = ${a * a}`, `4 + 4 = 8`], guide: `Adding ${a} four times is the same as ${a} × 4 = ${ans}.` };
            }},
            { type: "Pattern", anchor: "B-O.3.1.5", openEnded: false, gen: () => {
                const s = rand(1, 20); const step = rand(2, 10); const n = rand(4, 12); const ans = s + step * (n - 1);
                return { q: `A pattern starts at ${s} and adds ${step} each time. What is the ${n}th number in the pattern?`, ans: ans.toString(), distractors: [(ans + step).toString(), (ans - step).toString(), (s + step).toString()], guide: `The pattern is ${s}, ${s + step}, ${s + step * 2}, ... The ${n}th term = ${s} + ${step} × ${n - 1} = ${ans}.` };
            }},
            { type: "MassEst", anchor: "D-M.1.1.2", openEnded: false, gen: () => {
                return { q: `Which is the best estimate for the mass of a pencil?`, ans: "about 10 grams", distractors: ["about 10 kilograms", "about 1 kilogram", "about 100 grams"], guide: `A pencil is very light. Grams are used for small objects, and about 10 grams is a reasonable estimate.` };
            }},
            { type: "Elapsed", anchor: "D-M.1.1.1", openEnded: false, gen: () => {
                const startH = rand(1, 12); const dur = rand(1, 5); const durMin = choose([0, 15, 30, 45]); const endH = startH + dur + (durMin >= 60 ? 1 : 0); const endMin = durMin % 60;
                return { q: `A movie starts at ${startH}:00 PM and lasts ${dur} hour${dur > 1 ? 's' : ''}${durMin > 0 ? ` and ${durMin} minutes` : ''}. What time does it end?`, ans: `${endH}:${endMin === 0 ? '00' : endMin} PM`, distractors: [`${endH + 1}:00 PM`, `${startH}:${durMin === 0 ? '30' : '00'} PM`, `${endH}:${endMin === 0 ? '30' : '00'} PM`], guide: `Start at ${startH}:00 PM, add ${dur} hour${dur > 1 ? 's' : ''}${durMin > 0 ? ` and ${durMin} minutes` : ''} to get ${endH}:${endMin === 0 ? '00' : endMin} PM.` };
            }},
            { type: "BarData", anchor: "D-M.2.1.1", openEnded: false, gen: () => {
                const a = rand(5, 75); const b = rand(5, 75); const diff = Math.abs(a - b);
                const nameA = choose(["Soccer", "Baseball", "Tennis", "Swimming", "Gymnastics", "Track"]); const nameB = choose(["Basketball", "Football", "Hockey", "Volleyball", "Lacrosse", "Wrestling"]);
                return { q: `A bar graph shows ${nameA} with ${a} votes and ${nameB} with ${b} votes. How many more votes does ${a >= b ? nameA : nameB} have?`, ans: diff.toString(), distractors: [(a + b).toString(), (diff + 2).toString(), Math.min(a, b).toString()], guide: `Subtract the smaller from the larger: ${Math.max(a, b)} - ${Math.min(a, b)} = ${diff}.` };
            }},
            { type: "FracSize", anchor: "A-F.1.1.3", openEnded: false, gen: () => {
                const d1 = rand(2, 6); const d2 = rand(d1 + 1, 12); const d3 = rand(d2 + 1, 16);
                return { q: `Which fraction is the largest: 1/${d1}, 1/${d2}, or 1/${d3}?`, ans: `1/${d1}`, distractors: [`1/${d2}`, `1/${d3}`, `They are equal`], guide: `For unit fractions, the smaller the denominator, the larger the fraction. 1/${d1} > 1/${d2} > 1/${d3}.` };
            }},
            { type: "Rhombus", anchor: "E-G.1.1.1", openEnded: false, gen: () => {
                return { q: `A shape has 4 equal sides but no right angles. What is it?`, ans: "Rhombus", distractors: ["Square", "Rectangle", "Trapezoid"], guide: `A rhombus has four equal sides. Unlike a square, it does not require right angles.` };
            }},
            { type: "MultCtx", anchor: "B-O.1.1.1", openEnded: false, gen: () => {
                const packs = rand(2, 15); const perPack = rand(3, 12); const ans = packs * perPack;
                return { q: `You buy ${packs} packs of stickers. Each pack has ${perPack} stickers. How many stickers in all?`, ans: ans.toString(), distractors: [(packs + perPack).toString(), (ans + perPack).toString(), (ans - 1).toString()], guide: `Multiply the number of packs by stickers per pack: ${packs} × ${perPack} = ${ans}.` };
            }},
            { type: "DivCtx", anchor: "B-O.1.1.2", openEnded: false, gen: () => {
                const groups = rand(2, 12); const perGroup = rand(3, 12); const total = groups * perGroup;
                return { q: `There are ${total} students split equally into groups of ${perGroup}. How many groups are there?`, ans: groups.toString(), distractors: [perGroup.toString(), total.toString(), (groups + 1).toString()], guide: `Divide the total by the group size: ${total} ÷ ${perGroup} = ${groups}.` };
            }},
            { type: "EvenOdd", anchor: "A-T.1.1.5", openEnded: false, gen: () => {
                const n = rand(10, 999); const isEven = n % 2 === 0;
                return { q: `Is ${n} even or odd?`, ans: isEven ? "Even" : "Odd", distractors: [isEven ? "Odd" : "Even", "Neither", "Both"], guide: `A number is even if it is divisible by 2. ${n} ÷ 2 = ${n / 2}${isEven ? ', so it is even' : ' has a remainder, so it is odd'}.` };
            }},
            { type: "Half", anchor: "A-F.1.1.2", openEnded: false, gen: () => {
                const n = rand(2, 50) * 2;
                return { q: `What number is halfway between 0 and ${n}?`, ans: (n / 2).toString(), distractors: [n.toString(), (n / 2 + 1).toString(), "0"], guide: `Halfway between 0 and ${n} is ${n} ÷ 2 = ${n / 2}.` };
            }},

            // ===== 2022 SAMPLER GRADE 3 =====

            { type: "PlaceValueValue", anchor: "M03.A-T.1.1.4", openEnded: false, gen: () => {
                const digit = rand(1, 9); const num = rand(1, 9) * 1000 + rand(0, 9) * 100 + digit * 10 + rand(0, 9);
                return { q: `In the number ${num.toLocaleString()}, what is the value of the digit ${digit}?`, ans: `${digit} tens`, distractors: [`${digit} hundreds`, `${digit} ones`, `${digit} thousands`], guide: `The digit ${digit} is in the tens place, so its value is ${digit} tens or ${digit * 10}.` };
            }},
            { type: "RoundNearestTen", anchor: "M03.A-T.1.1.1", openEnded: false, gen: () => {
                const tens = rand(1, 9) * 10; const a = rand(tens + 1, tens + 9); const b = rand(tens + 1, tens + 9);
                return { q: `The inequality ${a} < ${b} is true. If you round both to the nearest ten, what does the symbol become?`, ans: "=", distractors: [">", "<", "≠"], guide: `${a} rounds to 40 and ${b} rounds to 40. Since 40 = 40, the symbol becomes equal.` };
            }},
            { type: "NumberOrder", anchor: "M03.A-T.1.1.4", openEnded: false, gen: () => {
                const base = rand(1100, 8500);
                const arr = [base, base + 10, base + 20, base + 30].sort(() => Math.random() - 0.5);
                const sorted = [...arr].sort((a, b) => b - a);
                return { q: `Order these numbers from greatest to least: ${arr.join(", ")}`, ans: sorted.join(", "), distractors: [[...sorted].reverse().join(", "), arr.join(", "), sorted.slice(1).join(", ")], guide: `Compare digits from left to right to find the largest value.` };
            }},
            { type: "MultiplicationLogic", anchor: "M03.B-O.1.2.1", openEnded: false, gen: () => {
                const g = rand(2, 12); const oz = rand(3, 16); const ans = g * oz;
                return { q: `Gary fills ${g} glasses with ${oz} oz each. Sara has the same total amount. How many total ounces does she have?`, ans: ans.toString(), distractors: [(g + oz).toString(), (ans - 5).toString(), (ans + 10).toString()], guide: `Multiply the number of glasses by the ounces per glass: ${g} × ${oz} = ${ans}.` };
            }},
            { type: "AreaDivision", anchor: "M03.D-M.3.1.2", openEnded: false, gen: () => {
                const l = rand(2, 8); const w = rand(2, 5); const count = rand(4, 15); const total = (l * w) * count;
                return { q: `A design has a total area of ${total} sq in. It is made of rectangles that are ${l} in by ${w} in. How many are there?`, ans: count.toString(), distractors: [(count + 2).toString(), (total / l).toString(), (l * w).toString()], guide: `One rectangle is ${l * w} sq in. ${total} ÷ ${l * w} = ${count}.` };
            }},
            { type: "AssociativeProperty", anchor: "M03.B-O.2.1.2", openEnded: false, gen: () => {
                const a = rand(3, 12); const b = rand(2, 6); const c = rand(2, 8);
                return { q: `Which expression shows another way to find the value of (${a} × ${b}) × ${c}?`, ans: `${a} × (${b} × ${c})`, distractors: [`(${a} + ${b}) × ${c}`, `(${a} × ${b}) + ${c}`, `${a} × (${b} + ${c})`], guide: `The associative property allows you to move grouping symbols in multiplication.` };
            }},
            { type: "PolygonDefinition", anchor: "M03.C-G.1", openEnded: false, gen: () => ({
                q: `A shape has one curved side. Why is it NOT a polygon?`, ans: "Polygons cannot have curved sides", distractors: ["Polygons must have 4 sides", "Sides must be different lengths", "It must have an inside"], guide: "By definition, polygons are made only of straight line segments."
            })},
            { type: "FractionID", anchor: "M03.A-F.1.1.2", openEnded: false, gen: () => {
                const d = rand(2, 16);
                return { q: `A shape is divided into ${d} equal parts. What fraction represents one part?`, ans: `1/${d}`, distractors: [`${d}/1`, "1/2", `${d - 1}/${d}`], guide: `One part out of ${d} total parts is 1/${d}.` };
            }},
            { type: "MassEstimate", anchor: "M03.D-M.1.1.2", openEnded: false, gen: () => ({
                q: `What is the best estimate for the mass of a single paperclip?`, ans: "1 gram", distractors: ["1 kilogram", "1 pound", "1 ton"], guide: "Grams are used for small, lightweight objects."
            })},
            { type: "TimeToMinute", anchor: "M03.D-M.1.1.1", openEnded: false, gen: () => {
                const h = rand(1, 12); const m = rand(1, 59);
                return { q: `The clock shows ${m} minutes past ${h}. What is the time?`, ans: `${h}:${m}`, distractors: [`${m}:${h}`, `${h}:00`, `${h + 1}:${m}`], guide: "Read the hour first, then the minutes." };
            }},
            { type: "EquivFrac", anchor: "M03.A-F.1.1.3", openEnded: false, gen: () => {
                const d = rand(2, 8);
                return { q: `Which fraction is equivalent to 1/${d}?`, ans: `2/${d * 2}`, distractors: [`1/${d + 1}`, `${d}/1`, "2/10"], guide: "Multiply the top and bottom by the same number." };
            }},
            { type: "BarData", anchor: "M03.D-M.2.1.1", openEnded: false, gen: () => {
                const a = rand(3, 40); const b = rand(a + 1, 50);
                return { q: `Hannah has ${a} rocks and Tom has ${b}. How many more does Tom have?`, ans: (b - a).toString(), distractors: [b.toString(), (a + b).toString(), "2"], guide: `${b} - ${a} = ${b - a}.` };
            }},
            { type: "PerimeterPath", anchor: "M03.D-M.4", openEnded: false, gen: () => ({
                q: `Grady swims the distance around the edge of a pool. This is the:`, ans: "Perimeter", distractors: ["Length", "Area", "Volume"], guide: "The distance around a shape is the perimeter."
            })},
            { type: "MissingFactor", anchor: "M03.B-O.1.2.2", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 12);
                return { q: `${a} × ? = ${a * b}`, ans: b.toString(), distractors: [a.toString(), (b + 1).toString(), (a * b - 1).toString()], guide: `Divide the product by the known factor: ${a * b} ÷ ${a} = ${b}.` };
            }},
            { type: "EvenOddID", anchor: "M03.A-T.1.1.5", openEnded: false, gen: () => {
                const n = rand(10, 199); const isE = n % 2 === 0;
                return { q: `Is ${n} even or odd?`, ans: isE ? "Even" : "Odd", distractors: [isE ? "Odd" : "Even", "Prime", "Zero"], guide: "Check the last digit: 0, 2, 4, 6, 8 are even." };
            }},
            { type: "RulerArea", anchor: "M03.D-M.3.1.2", openEnded: false, gen: () => {
                const s1 = rand(2, 12); const s2 = rand(3, 15);
                return { q: `A rectangle has sides of ${s1}cm and ${s2}cm. Area?`, ans: (s1 * s2).toString(), distractors: [(s1 + s2).toString(), (2 * s1 + 2 * s2).toString(), "10"], guide: `${s1} × ${s2} = ${s1 * s2}.` };
            }},
            { type: "Addition2Digit", anchor: "Add two 2-digit numbers.", openEnded: false, gen: () => {
                const a = rand(10, 99); const b = rand(10, 99); const ans = a + b;
                return { q: `What is ${a} + ${b}?`, ans: ans.toString(), distractors: [(ans + 10).toString(), (ans - 1).toString(), Math.abs(a - b).toString()], guide: `Add the ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Add the tens and carry if needed. ${a} + ${b} = ${ans}.` };
            }},
            { type: "Addition3Digit", anchor: "Add two 3-digit numbers.", openEnded: false, gen: () => {
                const a = rand(100, 999); const b = rand(100, 999); const ans = a + b;
                return { q: `What is ${a} + ${b}?`, ans: ans.toString(), distractors: [(ans + 100).toString(), (ans - 10).toString(), (ans + 1).toString()], guide: `Line up the digits by place value. ${a} + ${b} = ${ans}.` };
            }},
            { type: "Subtraction2Digit", anchor: "Subtract two 2-digit numbers.", openEnded: false, gen: () => {
                let a = rand(10, 99); let b = rand(10, 99); if (b > a) { const t = a; a = b; b = t; }
                const ans = a - b;
                return { q: `What is ${a} − ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (ans + 10).toString(), (ans - 1 < 0 ? 0 : ans - 1).toString()], guide: `Subtract place by place: ${a} − ${b} = ${ans}.` };
            }},
            { type: "Subtraction3Digit", anchor: "Subtract two 3-digit numbers.", openEnded: false, gen: () => {
                let a = rand(100, 999); let b = rand(100, 999); if (b > a) { const t = a; a = b; b = t; }
                const ans = a - b;
                return { q: `What is ${a} − ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (ans + 100).toString(), (ans + 10).toString()], guide: `Regroup if needed. ${a} − ${b} = ${ans}.` };
            }},
            { type: "MultiplyBasic", anchor: "Multiply single-digit factors.", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 12); const ans = a * b;
                return { q: `What is ${a} × ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (ans + a).toString(), (ans - b).toString()], guide: `${a} groups of ${b} equals ${a} × ${b} = ${ans}.` };
            }},
            { type: "MultiplyBy10", anchor: "Multiply by 10 or 100.", openEnded: false, gen: () => {
                const a = rand(2, 99); const m = choose([10, 100]); const ans = a * m;
                return { q: `What is ${a} × ${m}?`, ans: ans.toString(), distractors: [(a + m).toString(), (a * (m === 10 ? 100 : 10)).toString(), (ans + 10).toString()], guide: `When you multiply by ${m}, move the decimal point ${m === 10 ? '1 place' : '2 places'} to the right (add ${m === 10 ? 'one zero' : 'two zeros'}). ${a} × ${m} = ${ans}.` };
            }},
            { type: "DivideBasic", anchor: "Divide with no remainder.", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 12); const product = a * b;
                return { q: `What is ${product} ÷ ${a}?`, ans: b.toString(), distractors: [a.toString(), (b + 1).toString(), (b - 1 < 1 ? b + 2 : b - 1).toString()], guide: `Think: ${a} × ? = ${product}. Since ${a} × ${b} = ${product}, the answer is ${b}.` };
            }},
            { type: "DivideWithRemainder", anchor: "Divide with a remainder.", openEnded: false, gen: () => {
                const divisor = rand(2, 9); const quotient = rand(3, 15); const remainder = rand(1, divisor - 1);
                const total = divisor * quotient + remainder;
                return { q: `What is ${total} ÷ ${divisor}?`, ans: `${quotient} R${remainder}`, distractors: [`${quotient + 1}`, `${quotient} R${remainder + 1 >= divisor ? 0 : remainder + 1}`, `${quotient - 1} R${remainder}`], guide: `${divisor} × ${quotient} = ${divisor * quotient}, with ${remainder} left over. So ${total} ÷ ${divisor} = ${quotient} R${remainder}.` };
            }},
            { type: "PlaceValueIdentify", anchor: "Identify digits by place value.", openEnded: false, gen: () => {
                const thousands = rand(1, 9); const hundreds = rand(0, 9); const tens = rand(0, 9); const ones = rand(0, 9);
                const num = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
                const places = ["ones", "tens", "hundreds", "thousands"];
                const digits = [ones, tens, hundreds, thousands];
                const idx = rand(0, 3); const place = places[idx]; const digit = digits[idx];
                const formatted = num.toLocaleString();
                return { q: `In ${formatted}, what digit is in the ${place} place?`, ans: digit.toString(), distractors: [digits[(idx + 1) % 4].toString(), digits[(idx + 2) % 4].toString(), digits[(idx + 3) % 4].toString()], guide: `Break down ${formatted}: thousands = ${thousands}, hundreds = ${hundreds}, tens = ${tens}, ones = ${ones}. The ${place} digit is ${digit}.` };
            }},
            { type: "ExpandedForm", anchor: "Write numbers in expanded form.", openEnded: false, gen: () => {
                const useThousands = rand(0, 1); const th = useThousands ? rand(1, 9) : 0;
                const h = rand(1, 9); const t = rand(1, 9); const o = rand(1, 9);
                const num = th * 1000 + h * 100 + t * 10 + o;
                const parts = []; if (th > 0) parts.push(`${th * 1000}`); parts.push(`${h * 100}`); parts.push(`${t * 10}`); parts.push(`${o}`);
                const ans = parts.join(" + ");
                const wrong1 = parts.slice().reverse().join(" + ");
                const wrong2 = (th > 0 ? `${th} + ` : "") + `${h} + ${t} + ${o}`;
                const wrong3 = parts.map(p => String(Number(p) + 1)).join(" + ");
                return { q: `Write ${num.toLocaleString()} in expanded form.`, ans: ans, distractors: [wrong1 !== ans ? wrong1 : wrong3, wrong2, wrong3], guide: `Break each digit by its place value: ${ans}.` };
            }},
            { type: "CompareLargeNumbers", anchor: "Compare 4-digit numbers.", openEnded: false, gen: () => {
                const a = rand(1000, 9999); let b = rand(1000, 9999);
                while (b === a) b = rand(1000, 9999);
                const symbol = a > b ? ">" : a < b ? "<" : "=";
                return { q: `Compare: ${a.toLocaleString()} ___ ${b.toLocaleString()}. Fill in <, >, or =.`, ans: symbol, distractors: [symbol === ">" ? "<" : ">", "=", symbol === "<" ? ">" : "<"], guide: `Compare from left to right. ${a.toLocaleString()} is ${a > b ? "greater than" : "less than"} ${b.toLocaleString()}, so the answer is ${symbol}.` };
            }},
            { type: "SkipCounting", anchor: "Identify skip-counting patterns.", openEnded: false, gen: () => {
                const step = choose([2, 3, 4, 5, 6, 10, 25, 50, 100]);
                const start = rand(1, 20) * step;
                const seq = [start, start + step, start + 2 * step, start + 3 * step];
                const next = start + 4 * step;
                return { q: `What comes next? ${seq.join(", ")}, ___`, ans: next.toString(), distractors: [(next + step).toString(), (next - 1).toString(), (next + 1).toString()], guide: `The pattern increases by ${step} each time. ${seq[3]} + ${step} = ${next}.` };
            }},
            { type: "FractionOfShape", anchor: "Identify fractions from shaded parts.", openEnded: false, gen: () => {
                const total = choose([2, 3, 4, 5, 6, 8, 10]); const shaded = rand(1, total - 1);
                return { q: `A shape is divided into ${total} equal parts. ${shaded} parts are shaded. What fraction is shaded?`, ans: `${shaded}/${total}`, distractors: [`${total}/${shaded}`, `${shaded + 1}/${total}`, `${shaded}/${total + 1}`], guide: `The shaded fraction is the number of shaded parts over the total parts: ${shaded}/${total}.` };
            }},
            { type: "CompareFractions", anchor: "Compare unit fractions.", openEnded: false, gen: () => {
                let a = rand(2, 12); let b = rand(2, 12); while (b === a) b = rand(2, 12);
                const symbol = a < b ? ">" : "<";
                return { q: `Which is greater: 1/${a} or 1/${b}?`, ans: `1/${Math.min(a, b)}`, distractors: [`1/${Math.max(a, b)}`, "They are equal", `1/${a + b}`], guide: `With unit fractions, the smaller the denominator, the larger the piece. Since ${Math.min(a, b)} < ${Math.max(a, b)}, 1/${Math.min(a, b)} > 1/${Math.max(a, b)}.` };
            }},
            { type: "AddFractionsLikeDenom", anchor: "Add fractions with like denominators.", openEnded: false, gen: () => {
                const d = choose([3, 4, 5, 6, 8, 10]); const maxA = d - 2;
                const a = rand(1, maxA); const b = rand(1, d - a - 1); const num = a + b;
                return { q: `What is ${a}/${d} + ${b}/${d}?`, ans: `${num}/${d}`, distractors: [`${a + b}/${d + d}`, `${a * b}/${d}`, `${num + 1}/${d}`], guide: `Keep the denominator and add the numerators: ${a} + ${b} = ${num}. So the answer is ${num}/${d}.` };
            }},
            { type: "PerimeterRect", anchor: "Find perimeter of a rectangle.", openEnded: false, gen: () => {
                const l = rand(3, 50); const w = rand(2, 40); const ans = 2 * (l + w);
                return { q: `A rectangle has a length of ${l} units and a width of ${w} units. What is the perimeter?`, ans: ans.toString(), distractors: [(l * w).toString(), (l + w).toString(), (2 * l + w).toString()], guide: `Perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = 2 × ${l + w} = ${ans}.` };
            }},
            { type: "AreaRect", anchor: "Find area of a rectangle.", openEnded: false, gen: () => {
                const l = rand(3, 50); const w = rand(2, 40); const ans = l * w;
                return { q: `A rectangle has a length of ${l} units and a width of ${w} units. What is the area?`, ans: ans.toString(), distractors: [(2 * (l + w)).toString(), (l + w).toString(), (ans + l).toString()], guide: `Area = length × width = ${l} × ${w} = ${ans} square units.` };
            }},
            { type: "ArrayModel", anchor: "Use arrays to multiply.", openEnded: false, gen: () => {
                const rows = rand(2, 12); const cols = rand(2, 12); const ans = rows * cols;
                return { q: `An array has ${rows} rows and ${cols} columns. How many items are there in total?`, ans: ans.toString(), distractors: [(rows + cols).toString(), (ans + rows).toString(), (ans - cols).toString()], guide: `Multiply rows × columns: ${rows} × ${cols} = ${ans}.` };
            }}
        ],
        4: [
            { type: "Dec Frac", anchor: "Tenths and hundredths notation.", openEnded: false, gen: () => {
                const v = rand(1, 99); const dec = (v/100).toFixed(2);
                return { q: `Which fraction is equal to ${dec}?`, ans: `${v}/100`, distractors: [`1/${v}`, `100/${v}`, `${v}/10`], guide: `The decimal ${dec} has two places, which represents ${v} hundredths.` };
            }},
            { type: "Word Form", anchor: "Write numbers in word form.", openEnded: false, gen: () => {
                const thousands = rand(2, 9) * 10 + rand(1, 9); const ones = rand(1, 9) * 10;
                const num = thousands * 1000 + ones;
                return { q: `Which shows ${num.toLocaleString()} in word form?`, ans: `${numberToWord(thousands)} thousand, ${numberToWord(ones)}`, distractors: [`${numberToWord(thousands)} thousand, ${numberToWord(Math.floor(ones/10))}`, `${numberToWord(ones)} thousand, ${numberToWord(thousands)}`, `${numberToWord(thousands)} hundred`], guide: `The digits in the thousands period are ${thousands}, and the remaining digits form ${ones}.` };
            }},
            { type: "Rounding", anchor: "Round to any place.", openEnded: false, gen: () => {
                const base = rand(10, 99) * 1000; const offset = rand(1, 999); const num = base + offset;
                const ans = Math.round(num/1000)*1000;
                return { q: `Round ${num.toLocaleString()} to the nearest thousand.`, ans: ans.toLocaleString(), distractors: [base.toLocaleString(), (ans+1000).toLocaleString(), (base+500).toLocaleString()], guide: `The hundreds digit is ${Math.floor((num % 1000)/100)}. Since it's 5 or more, round up to ${ans.toLocaleString()}.` };
            }},
            { type: "Remainders", anchor: "Find quotients and remainders.", openEnded: false, gen: () => {
                const divisor = rand(3, 12); const quotient = rand(5, 25); const rem = rand(1, divisor - 1); const num = divisor * quotient + rem;
                return { q: `What is the remainder when ${num} is divided by ${divisor}?`, ans: rem.toString(), distractors: [quotient.toString(), divisor.toString(), "0"], guide: `${divisor} × ${quotient} = ${divisor*quotient}. ${num} - ${divisor*quotient} = ${rem}.` };
            }},
            { type: "Multi-Step", anchor: "Solve multi-step whole number problems.", openEnded: false, gen: () => {
                const f = rand(10, 80); const b = rand(50, 200); const c = rand(2, 8); const ans = f * b * c;
                return { q: `A building has ${f} floors with ${b} bulbs each. If it costs $${c} to replace each bulb, total cost?`, ans: `$${ans.toLocaleString()}`, distractors: [`$${(f*b).toLocaleString()}`, `$${(b*c).toLocaleString()}`, `$${(ans-100).toLocaleString()}`], guide: `Total bulbs = ${f} × ${b} = ${f*b}. Total cost = ${f*b} × $${c} = $${ans.toLocaleString()}.` };
            }},
            { type: "Frac Bench", anchor: "Compare fractions using benchmarks.", openEnded: false, gen: () => {
                const n1 = rand(1, 5); const d1 = rand(6, 15); const n2 = rand(1, 5); const d2 = rand(3, 8);
                const v1 = n1/d1; const v2 = n2/d2;
                const symbol = v1 < v2 ? '<' : v1 > v2 ? '>' : '=';
                return { q: `Compare ${n1}/${d1} and ${n2}/${d2}.`, ans: `${n1}/${d1} ${symbol} ${n2}/${d2}`, distractors: [`${n1}/${d1} ${symbol === '<' ? '>' : '<'} ${n2}/${d2}`, `${n1}/${d1} = ${n2}/${d2}`, `${n1}/${d1} > 1`], guide: `${n1}/${d1} ≈ ${v1.toFixed(2)}. ${n2}/${d2} ≈ ${v2.toFixed(2)}. So ${n1}/${d1} ${symbol} ${n2}/${d2}.` };
            }},
            { type: "Frac Add", anchor: "Add fractions with like denominators.", openEnded: false, gen: () => {
                const d = rand(8, 15); const n1 = rand(1, 3); const n2 = rand(2, 5); const n3 = rand(1, 3); const sum = n1 + n2 + n3;
                return { q: `Simplify: ${n1}/${d} + ${n2}/${d} + ${n3}/${d}`, ans: `${sum}/${d}`, distractors: [`${sum}/${d*3}`, `1/${d}`, `${sum-1}/${d}`], guide: `Add the numerators: ${n1} + ${n2} + ${n3} = ${sum}. Keep the denominator ${d}.` };
            }},
            { type: "Dec Comp", anchor: "Compare decimals to hundredths.", openEnded: false, gen: () => {
                const whole = rand(1, 5); const d1 = rand(1, 9); const d2 = rand(d1+1, 9);
                const v1 = whole + d1/100; const v2 = whole + d2/10;
                return { q: `Which is a correct comparison of ${v1.toFixed(2)} and ${v2.toFixed(1)}?`, ans: `${v1.toFixed(2)} < ${v2.toFixed(1)}`, distractors: [`${v1.toFixed(2)} > ${v2.toFixed(1)}`, `${v1.toFixed(2)} = ${v2.toFixed(1)}`, `Cannot compare`], guide: `${v2.toFixed(1)} is the same as ${v2.toFixed(2)}. Since ${(d1/100).toFixed(2)} < ${(d2/10).toFixed(2)}, the answer is <.` };
            }},
            { type: "Factors", anchor: "Find factor pairs.", openEnded: false, gen: () => {
                const nums = [12, 18, 24, 30, 36];
                const num = nums[rand(0, nums.length - 1)];
                const factors = [];
                for (let i = 1; i <= num; i++) { if (num % i === 0) factors.push(i); }
                const missing = factors.slice(1, -1);
                return { q: `Which set contains all the factors of ${num}?`, ans: factors.join(', '), distractors: [missing.join(', '), `1, ${num}`, factors.slice(0, Math.ceil(factors.length/2)).join(', ')], guide: `List all pairs that multiply to ${num}: ${factors.join(', ')}.` };
            }},
            { type: "Prime", anchor: "Prime vs Composite.", openEnded: false, gen: () => {
                const primes = [11, 13, 17, 19, 23, 29, 31];
                const p = primes[rand(0, primes.length - 1)];
                return { q: `Which of these numbers is prime?`, ans: p.toString(), distractors: ["9", "15", "21"], guide: `A prime number has only two factors: 1 and itself. ${p} cannot be divided by anything else.` };
            }},
            { type: "Metric", anchor: "Convert metric units.", openEnded: false, gen: () => {
                const m = rand(4, 12); const ans = m * 100;
                return { q: `Convert ${m} meters to centimeters.`, ans: ans.toString(), distractors: [(m*10).toString(), (m*1000).toString(), "100"], guide: `1 meter = 100 cm. So, ${m} × 100 = ${ans} cm.` };
            }},
            { type: "Angles", anchor: "Identify angle types.", openEnded: false, gen: () => {
                const deg = rand(95, 170);
                return { q: `An angle measures ${deg} degrees. What type of angle is it?`, ans: "Obtuse", distractors: ["Acute", "Right", "Straight"], guide: `Any angle greater than 90 degrees but less than 180 degrees is obtuse.` };
            }},
            { type: "Protractor", anchor: "Measure angles.", openEnded: false, gen: () => {
                const deg = rand(25, 85);
                return { q: `One ray of an angle is at 0° and the other is at ${deg}°. What is the angle's measure?`, ans: `${deg}°`, distractors: [`${180-deg}°`, `${deg+10}°`, `90°`], guide: `The degree measure is the difference between the two rays: ${deg} - 0 = ${deg}.` };
            }},
            { type: "Symmetry", anchor: "Recognize lines of symmetry.", openEnded: false, gen: () => {
                const shapes = [{s: "square", n: 4}, {s: "rectangle", n: 2}, {s: "equilateral triangle", n: 3}];
                const pick = shapes[rand(0, shapes.length - 1)];
                return { q: `How many lines of symmetry does a ${pick.s} have?`, ans: pick.n.toString(), distractors: ["1", pick.n === 4 ? "6" : "4", "0"], guide: `A ${pick.s} has ${pick.n} line(s) of symmetry.` };
            }},
            { type: "Area", anchor: "Area of rectangles.", openEnded: false, gen: () => {
                const l = rand(6, 10); const w = rand(3, 5); const ans = l * w;
                return { q: `What is the area of a rectangle that is ${l} units long and ${w} units wide?`, ans: ans.toString(), distractors: [(l+w).toString(), (2*l+2*w).toString(), (ans-5).toString()], guide: `Area = Length × Width = ${l} × ${w} = ${ans}.` };
            }},
            { type: "Perimeter", anchor: "Perimeter word problems.", openEnded: false, gen: () => {
                const p = rand(12, 24); const ans = p * 2;
                return { q: `If the perimeter of a shape is ${p} inches, what is the perimeter of a shape that is exactly double that size?`, ans: ans.toString(), distractors: [p.toString(), (p+2).toString(), (p*p).toString()], guide: `Double the size means multiplying the perimeter by 2: ${p} × 2 = ${ans}.` };
            }},
            { type: "Mult4x1", anchor: "A-T.2.1.2", openEnded: false, gen: () => {
                const a = rand(1001, 4999); const b = rand(2, 9); const ans = a * b;
                return { q: `Calculate ${a} × ${b}.`, ans: ans.toString(), distractors: [(ans + b).toString(), (ans - a).toString(), (a + b).toString()], guide: `Multiply each digit of ${a} by ${b}, carrying as needed: ${a} × ${b} = ${ans}.` };
            }},
            { type: "CompWord", anchor: "A-T.1.1.3", openEnded: false, gen: () => {
                const a = rand(2, 9); const b = rand(3, 8); const ans = a * b;
                return { q: `What is ${a} times as much as ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (a - b + 10).toString(), (ans + a).toString()], guide: `"${a} times as much as ${b}" means ${a} × ${b} = ${ans}.` };
            }},
            { type: "SubLarge", anchor: "A-T.2.1.1", openEnded: false, gen: () => {
                const sub = rand(10000, 40000); const ans = 50000 - sub;
                return { q: `What is 50,000 - ${sub.toLocaleString()}?`, ans: ans.toLocaleString(), distractors: [(ans + 1000).toLocaleString(), (ans - 1000).toLocaleString(), (50000 + sub).toLocaleString()], guide: `50,000 - ${sub.toLocaleString()} = ${ans.toLocaleString()}.` };
            }},
            { type: "FracCompDen", anchor: "A-F.1.1.2", openEnded: false, gen: () => {
                const n = rand(1, 3); const d1 = rand(3, 5); const d2 = rand(d1 + 2, 10);
                return { q: `Which is greater: ${n}/${d1} or ${n}/${d2}?`, ans: `${n}/${d1}`, distractors: [`${n}/${d2}`, `They are equal`, `Cannot tell`], guide: `When numerators are equal, the fraction with the smaller denominator is larger. Since ${d1} < ${d2}, ${n}/${d1} > ${n}/${d2}.` };
            }},
            { type: "MixedAdd", anchor: "A-F.2.1.1", openEnded: false, gen: () => {
                const w1 = rand(1, 3); const w2 = rand(1, 3); const d = rand(3, 6); const n1 = rand(1, d - 2); const n2 = rand(1, d - n1);
                const ansW = w1 + w2 + Math.floor((n1 + n2) / d); const ansN = (n1 + n2) % d;
                const ansStr = ansN > 0 ? `${ansW} ${ansN}/${d}` : ansW.toString();
                return { q: `Add: ${w1} ${n1}/${d} + ${w2} ${n2}/${d}`, ans: ansStr, distractors: [`${w1 + w2} ${n1}/${d}`, `${ansW + 1} ${ansN}/${d}`, `${w1 + w2}`], guide: `Add the whole numbers: ${w1} + ${w2} = ${w1 + w2}. Add the fractions: ${n1}/${d} + ${n2}/${d} = ${n1 + n2}/${d}. Result: ${ansStr}.` };
            }},
            { type: "PatternMult", anchor: "B-O.3.1.2", openEnded: false, gen: () => {
                const start = rand(2, 10); const mult = rand(2, 5); const t2 = start * mult; const t3 = t2 * mult; const t4 = t3 * mult;
                return { q: `A pattern starts at ${start} and each term is multiplied by ${mult}. What is the 4th term?`, ans: t4.toString(), distractors: [t3.toString(), (t4 + mult).toString(), (start * 4).toString()], guide: `${start}, ${t2}, ${t3}, ${t4}. Each term is multiplied by ${mult}.` };
            }},
            { type: "Moneyctx", anchor: "D-M.1.1.2", openEnded: false, gen: () => {
                const q = rand(4, 20); const ans = q * 25;
                return { q: `How many cents are in ${q} quarters?`, ans: `${ans} cents`, distractors: [`${q} cents`, `${q * 10} cents`, `${ans + 25} cents`], guide: `Each quarter is worth 25 cents. ${q} × 25 = ${ans} cents.` };
            }},
            { type: "LinePlot", anchor: "D-M.2.1.2", openEnded: false, gen: () => {
                const v1 = rand(2, 5); const v2 = rand(3, 6); const v3 = rand(1, 4); const total = v1 + v2 + v3;
                return { q: `A line plot shows ${v1} dots above 1/4, ${v2} dots above 1/2, and ${v3} dots above 3/4. How many data points are there in all?`, ans: total.toString(), distractors: [(total + 1).toString(), v2.toString(), (v1 + v3).toString()], guide: `Add all the dots: ${v1} + ${v2} + ${v3} = ${total}.` };
            }},
            { type: "RayID", anchor: "E-G.1.1.1", openEnded: false, gen: () => {
                return { q: `A line that has one endpoint and extends forever in one direction is called a:`, ans: "Ray", distractors: ["Line", "Line segment", "Point"], guide: `A ray has one fixed endpoint and extends infinitely in one direction.` };
            }},
            { type: "RightTri", anchor: "E-G.1.1.2", openEnded: false, gen: () => {
                return { q: `A triangle with one 90-degree angle is called a:`, ans: "Right triangle", distractors: ["Acute triangle", "Obtuse triangle", "Equilateral triangle"], guide: `A right triangle is defined as a triangle that contains exactly one 90-degree angle.` };
            }},
            { type: "Parallel", anchor: "E-G.1.1.1", openEnded: false, gen: () => {
                return { q: `Lines in the same plane that never intersect are called:`, ans: "Parallel lines", distractors: ["Perpendicular lines", "Intersecting lines", "Skew lines"], guide: `Parallel lines are coplanar lines that never cross, no matter how far they are extended.` };
            }},
            { type: "FracSub", anchor: "A-F.2.1.2", openEnded: false, gen: () => {
                const d = rand(5, 12); const n1 = rand(3, d - 1); const n2 = rand(1, n1 - 1); const ansN = n1 - n2;
                const g = gcd(ansN, d); const sn = ansN / g; const sd = d / g;
                return { q: `Subtract: ${n1}/${d} - ${n2}/${d}`, ans: `${sn}/${sd}`, distractors: [`${n1 + n2}/${d}`, `${ansN}/${d * 2}`, `${n2}/${d}`], guide: `Subtract the numerators: ${n1} - ${n2} = ${ansN}. Keep the denominator: ${ansN}/${d}${g > 1 ? ` = ${sn}/${sd}` : ''}.` };
            }},

            // ===== 2022 SAMPLER GRADE 4 =====

            { type: "TenTimesValue", anchor: "M04.A-T.1.1.1", openEnded: false, gen: () => {
                const d = rand(2, 8);
                return { q: `Which number has a digit ${d} that is 10 times the value of ${d} in the tens place?`, ans: `A number with ${d} in the hundreds place`, distractors: [`${d} in the ones`, `${d} in the thousands`, "None"], guide: `10 times ${d}0 is ${d}00.` };
            }},
            { type: "TotalPriceAdd", anchor: "M04.A-T.2.1.2", openEnded: false, gen: () => {
                const a1 = rand(100, 120); const a2 = rand(80, 98);
                const ans = (a1 * 6) + (a2 * 8);
                return { q: `Floor A (${a1} sq ft at $6) and Floor B (${a2} sq ft at $8). Total?`, ans: `$${ans}`, distractors: [`$${(a1 + a2) * 6}`, `$${a1 * 6}`, `$${ans - 50}`], guide: `(6 × ${a1}) + (8 × ${a2}) = ${ans}.` };
            }},
            { type: "FracBetween", anchor: "M04.A-F.1.1.2", openEnded: false, gen: () => ({
                q: `Which fraction with denominator 8 is between 1/2 and 3/4?`, ans: "5/8", distractors: ["4/8", "6/8", "1/8"], guide: "1/2 = 4/8 and 3/4 = 6/8. 5/8 is between them."
            })},
            { type: "CompWordLogic", anchor: "M04.A-T.2.1.1", openEnded: false, gen: () => {
                const s = rand(1200, 1300); const diff = rand(300, 310);
                return { q: `Saturday had ${s} people, which is ${diff} more than Wednesday. Wednesday total?`, ans: (s - diff).toString(), distractors: [(s + diff).toString(), s.toString(), diff.toString()], guide: `${s} - ${diff} = ${s - diff}.` };
            }},
            { type: "LongMultiplication", anchor: "Multiply two 2-digit numbers.", openEnded: false, gen: () => {
                const a = rand(12, 99); const b = rand(12, 99); const ans = a * b;
                return { q: `What is ${a} × ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (ans + a).toString(), (ans - b).toString()], guide: `Break it up: ${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10} = ${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${ans}.` };
            }},
            { type: "Multiply3x1", anchor: "Multiply a 3-digit number by a 1-digit number.", openEnded: false, gen: () => {
                const a = rand(100, 999); const b = rand(2, 9); const ans = a * b;
                return { q: `What is ${a} × ${b}?`, ans: ans.toString(), distractors: [(a + b).toString(), (ans + 100).toString(), (ans - b).toString()], guide: `Multiply each place value: ${a} × ${b} = ${ans}.` };
            }},
            { type: "LongDivision", anchor: "Divide by a single digit with remainder.", openEnded: false, gen: () => {
                const divisor = rand(2, 9); const quotient = rand(10, 150); const remainder = rand(1, divisor - 1);
                const dividend = divisor * quotient + remainder;
                return { q: `What is ${dividend} ÷ ${divisor}?`, ans: `${quotient} R${remainder}`, distractors: [`${quotient}`, `${quotient + 1} R${remainder}`, `${quotient} R${remainder + 1 >= divisor ? 0 : remainder + 1}`], guide: `${divisor} × ${quotient} = ${divisor * quotient}. ${dividend} − ${divisor * quotient} = ${remainder}. So ${dividend} ÷ ${divisor} = ${quotient} R${remainder}.` };
            }},
            { type: "DivisionNoRemainder", anchor: "Divide evenly with no remainder.", openEnded: false, gen: () => {
                const a = rand(2, 9); const b = rand(10, 150); const product = a * b;
                return { q: `What is ${product} ÷ ${a}?`, ans: b.toString(), distractors: [(b + 1).toString(), (b - 1).toString(), a.toString()], guide: `${a} × ${b} = ${product}, so ${product} ÷ ${a} = ${b}.` };
            }},
            { type: "AddDecimals", anchor: "Add decimals to the hundredths.", openEnded: false, gen: () => {
                const a = rand(1, 99) / 100 + rand(1, 50); const b = rand(1, 99) / 100 + rand(1, 50);
                const aStr = a.toFixed(2); const bStr = b.toFixed(2); const ans = (a + b).toFixed(2);
                return { q: `What is ${aStr} + ${bStr}?`, ans: ans, distractors: [(a + b + 0.1).toFixed(2), (a + b - 0.01).toFixed(2), (a + b + 1).toFixed(2)], guide: `Line up the decimal points: ${aStr} + ${bStr} = ${ans}.` };
            }},
            { type: "SubtractDecimals", anchor: "Subtract decimals.", openEnded: false, gen: () => {
                let a = rand(1, 99) / 100 + rand(10, 50); let b = rand(1, 99) / 100 + rand(1, 30);
                if (b > a) { const t = a; a = b; b = t; }
                const aStr = a.toFixed(2); const bStr = b.toFixed(2); const ans = (a - b).toFixed(2);
                return { q: `What is ${aStr} − ${bStr}?`, ans: ans, distractors: [(a + b).toFixed(2), (a - b + 0.1).toFixed(2), (a - b - 0.01).toFixed(2)], guide: `Line up the decimals: ${aStr} − ${bStr} = ${ans}.` };
            }},
            { type: "FractionToDecimal", anchor: "Convert a fraction to a decimal.", openEnded: false, gen: () => {
                const pairs = [{n:1,d:2,dec:"0.5"},{n:1,d:4,dec:"0.25"},{n:3,d:4,dec:"0.75"},{n:1,d:5,dec:"0.2"},{n:2,d:5,dec:"0.4"},{n:3,d:5,dec:"0.6"},{n:4,d:5,dec:"0.8"},{n:1,d:10,dec:"0.1"},{n:3,d:10,dec:"0.3"},{n:7,d:10,dec:"0.7"},{n:9,d:10,dec:"0.9"}];
                const p = choose(pairs); const others = pairs.filter(x => x.dec !== p.dec);
                const d1 = choose(others).dec; const d2 = choose(others.filter(x => x.dec !== d1)).dec;
                return { q: `What is ${p.n}/${p.d} as a decimal?`, ans: p.dec, distractors: [d1, d2, (Number(p.dec) + 0.1).toFixed(1)], guide: `Divide ${p.n} by ${p.d}: ${p.n} ÷ ${p.d} = ${p.dec}.` };
            }},
            { type: "DecimalToFraction", anchor: "Convert a decimal to a fraction.", openEnded: false, gen: () => {
                const pairs = [{dec:"0.25",frac:"1/4"},{dec:"0.5",frac:"1/2"},{dec:"0.75",frac:"3/4"},{dec:"0.1",frac:"1/10"},{dec:"0.2",frac:"1/5"},{dec:"0.4",frac:"2/5"},{dec:"0.6",frac:"3/5"},{dec:"0.8",frac:"4/5"}];
                const p = choose(pairs); const others = pairs.filter(x => x.frac !== p.frac);
                const d1 = choose(others).frac; const d2 = choose(others.filter(x => x.frac !== d1)).frac;
                return { q: `What is ${p.dec} as a fraction?`, ans: p.frac, distractors: [d1, d2, `${p.dec}/1`], guide: `${p.dec} = ${p.frac}.` };
            }},
            { type: "MixedToImproper", anchor: "Convert a mixed number to an improper fraction.", openEnded: false, gen: () => {
                const whole = rand(1, 12); const d = choose([2, 3, 4, 5, 6, 8]); const n = rand(1, d - 1);
                const improperNum = whole * d + n;
                return { q: `Convert ${whole} ${n}/${d} to an improper fraction.`, ans: `${improperNum}/${d}`, distractors: [`${whole + n}/${d}`, `${improperNum}/${d + 1}`, `${whole * n}/${d}`], guide: `Multiply the whole number by the denominator and add the numerator: ${whole} × ${d} + ${n} = ${improperNum}. The answer is ${improperNum}/${d}.` };
            }},
            { type: "ImproperToMixed", anchor: "Convert an improper fraction to a mixed number.", openEnded: false, gen: () => {
                const d = choose([2, 3, 4, 5, 6, 7, 8]); const whole = rand(1, 12); const rem = rand(1, d - 1);
                const numerator = whole * d + rem;
                return { q: `Convert ${numerator}/${d} to a mixed number.`, ans: `${whole} ${rem}/${d}`, distractors: [`${whole + 1} ${rem}/${d}`, `${whole} ${rem + 1 >= d ? 1 : rem + 1}/${d}`, `${numerator}/${d + 1}`], guide: `Divide ${numerator} by ${d}: ${numerator} ÷ ${d} = ${whole} with remainder ${rem}. So ${numerator}/${d} = ${whole} ${rem}/${d}.` };
            }},
            { type: "AddFractionsDiffDenom", anchor: "Add fractions with different denominators.", openEnded: false, gen: () => {
                const d1 = choose([2, 3, 4, 5, 6]); let d2 = choose([2, 3, 4, 5, 6]); while (d2 === d1) d2 = choose([2, 3, 4, 5, 6]);
                const n1 = rand(1, d1 - 1); const n2 = rand(1, d2 - 1);
                const lcd = (d1 * d2) / gcd(d1, d2); const num = n1 * (lcd / d1) + n2 * (lcd / d2);
                const g = gcd(num, lcd); const sn = num / g; const sd = lcd / g;
                const whole = Math.floor(sn / sd); const rem = sn % sd;
                const ans = whole > 0 ? (rem > 0 ? `${whole} ${rem}/${sd}` : whole.toString()) : `${sn}/${sd}`;
                return { q: `What is ${n1}/${d1} + ${n2}/${d2}?`, ans: ans, distractors: [`${n1 + n2}/${d1 + d2}`, `${n1 + n2}/${d1}`, `${num}/${lcd}`], guide: `Find LCD of ${d1} and ${d2} = ${lcd}. Rewrite: ${n1 * (lcd / d1)}/${lcd} + ${n2 * (lcd / d2)}/${lcd} = ${num}/${lcd}${g > 1 ? ` = ${sn}/${sd}` : ''}${whole > 0 ? ` = ${ans}` : ''}.` };
            }},
            { type: "SubtractFractions", anchor: "Subtract fractions with different denominators.", openEnded: false, gen: () => {
                let da = choose([2, 3, 4, 5, 6]); let db = choose([2, 3, 4, 5, 6]); while (db === da) db = choose([2, 3, 4, 5, 6]);
                let na = rand(1, da - 1); let nb = rand(1, db - 1);
                const lcd = (da * db) / gcd(da, db);
                let topA = na * (lcd / da); let topB = nb * (lcd / db);
                if (topB > topA) { let tmp; tmp = na; na = nb; nb = tmp; tmp = da; da = db; db = tmp; tmp = topA; topA = topB; topB = tmp; }
                const num = topA - topB; const g = num > 0 ? gcd(num, lcd) : 1; const sn = num / g; const sd = lcd / g;
                const ans = num === 0 ? "0" : `${sn}/${sd}`;
                return { q: `What is ${na}/${da} − ${nb}/${db}?`, ans: ans, distractors: [`${Math.abs(na - nb)}/${da}`, `${num}/${lcd}`, `${sn + 1}/${sd}`], guide: `Find LCD = ${lcd}. Subtract numerators: ${topA} − ${topB} = ${num}. Simplify: ${ans}.` };
            }},
            { type: "FactorPairs", anchor: "Find all factor pairs of a number.", openEnded: false, gen: () => {
                const n = choose([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48, 54, 56, 60, 72]);
                const pairs = []; for (let i = 1; i <= Math.sqrt(n); i++) { if (n % i === 0) pairs.push(`(${i}, ${n / i})`); }
                const ans = pairs.join(", ");
                return { q: `List all factor pairs of ${n}.`, ans: ans, distractors: [pairs.slice(0, -1).join(", "), pairs.slice(1).join(", "), `(1, ${n}), (2, ${n / 2 | 0})`], guide: `Check each number from 1 up to √${n}. Factor pairs: ${ans}.` };
            }},
            { type: "PrimeOrComposite", anchor: "Determine if a number is prime or composite.", openEnded: false, gen: () => {
                const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
                const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 33, 35, 36, 38, 39, 40, 42, 44, 45, 46, 48, 49, 50];
                const isPrime = rand(0, 1) === 1; const n = isPrime ? choose(primes) : choose(composites);
                return { q: `Is ${n} prime or composite?`, ans: isPrime ? "Prime" : "Composite", distractors: [isPrime ? "Composite" : "Prime", "Neither", "Both"], guide: isPrime ? `${n} has only two factors: 1 and ${n}. It is prime.` : `${n} has more than two factors (e.g., 1, ${n}, and others). It is composite.` };
            }},
            { type: "MultiplesList", anchor: "Find a specific multiple of a number.", openEnded: false, gen: () => {
                const n = rand(2, 12); const pos = choose([3, 4, 5, 6, 7, 8, 9, 10]);
                const ordinal = pos === 3 ? "3rd" : pos === 4 ? "4th" : pos === 5 ? "5th" : pos === 6 ? "6th" : pos === 7 ? "7th" : pos === 8 ? "8th" : pos === 9 ? "9th" : "10th";
                const ans = n * pos;
                return { q: `What is the ${ordinal} multiple of ${n}?`, ans: ans.toString(), distractors: [(n * (pos - 1)).toString(), (n * (pos + 1)).toString(), (n + pos).toString()], guide: `Multiples of ${n}: ${n}, ${n*2}, ${n*3}, ... The ${ordinal} multiple is ${n} × ${pos} = ${ans}.` };
            }},
            { type: "RoundDecimals", anchor: "Round a decimal to the nearest tenth.", openEnded: false, gen: () => {
                const whole = rand(1, 99); const tenths = rand(0, 9); const hundredths = rand(0, 9);
                const num = whole + tenths / 10 + hundredths / 100; const numStr = num.toFixed(2);
                const rounded = Math.round(num * 10) / 10; const ans = rounded.toFixed(1);
                return { q: `Round ${numStr} to the nearest tenth.`, ans: ans, distractors: [Math.round(num).toFixed(0), (rounded + 0.1).toFixed(1), (rounded - 0.1).toFixed(1)], guide: `Look at the hundredths digit (${hundredths}). Since ${hundredths} is ${hundredths >= 5 ? "5 or more, round up" : "less than 5, round down"}. ${numStr} rounds to ${ans}.` };
            }},
            { type: "AngleMeasure", anchor: "Classify angles as acute, right, or obtuse.", openEnded: false, gen: () => {
                const kind = choose(["acute", "right", "obtuse"]);
                const degrees = kind === "acute" ? rand(10, 89) : kind === "right" ? 90 : rand(91, 179);
                const ans = kind === "acute" ? "Acute" : kind === "right" ? "Right" : "Obtuse";
                const others = ["Acute", "Right", "Obtuse"].filter(x => x !== ans);
                return { q: `An angle measures ${degrees}°. Is it acute, right, or obtuse?`, ans: ans, distractors: [others[0], others[1], "Straight"], guide: `An acute angle is less than 90°. A right angle is exactly 90°. An obtuse angle is between 90° and 180°. Since ${degrees}° is ${kind}, the answer is ${ans}.` };
            }},
            { type: "OrderOfOps", anchor: "Evaluate using order of operations.", openEnded: false, gen: () => {
                const style = rand(0, 2);
                let q, ans;
                if (style === 0) {
                    const a = rand(2, 15); const b = rand(2, 10); const c = rand(1, 10);
                    ans = a + b * c; q = `${a} + ${b} × ${c}`;
                } else if (style === 1) {
                    const a = rand(2, 10); const b = rand(2, 10); const c = rand(1, 20);
                    ans = a * b - c; q = `${a} × ${b} − ${c}`;
                } else {
                    const a = rand(2, 10); const b = rand(1, 10); const c = rand(2, 9);
                    ans = (a + b) * c; q = `(${a} + ${b}) × ${c}`;
                }
                return { q: `Evaluate: ${q}`, ans: ans.toString(), distractors: [(ans + 1).toString(), (ans - 2).toString(), (ans + 10).toString()], guide: `Follow order of operations (parentheses first, then multiplication/division, then addition/subtraction). ${q} = ${ans}.` };
            }},
            { type: "InputOutputTable", anchor: "Find the output given a rule.", openEnded: false, gen: () => {
                const rules = [
                    { desc: "multiply by", m: rand(2, 9), b: 0 },
                    { desc: "multiply by", m: rand(2, 6), b: rand(1, 10) },
                    { desc: "multiply by", m: rand(2, 5), b: -rand(1, 5) }
                ];
                const rule = choose(rules); const m = rule.m; const b = rule.b;
                const inputs = [rand(1, 10), rand(11, 20), rand(21, 30)];
                const outputs = inputs.map(x => m * x + b);
                const testInput = rand(31, 50); const ans = m * testInput + b;
                const ruleStr = b === 0 ? `× ${m}` : b > 0 ? `× ${m} + ${b}` : `× ${m} − ${Math.abs(b)}`;
                const table = inputs.map((inp, i) => `${inp} → ${outputs[i]}`).join(", ");
                return { q: `Rule: ${ruleStr}. Given ${table}, what is the output for ${testInput}?`, ans: ans.toString(), distractors: [(ans + m).toString(), (ans - b).toString(), (testInput * m).toString()], guide: `Apply the rule to ${testInput}: ${testInput} ${ruleStr} = ${ans}.` };
            }}
        ],
        5: [
            { type: "Add Frac", anchor: "Add fractions with unlike denominators.", openEnded: false, gen: () => {
                const n1 = rand(3, 7); const d1 = rand(4, 8); const n2 = rand(3, 7); const d2 = rand(3, 6);
                if (d1 === d2) d1 === 8 ? d2 : d1; // ensure unlike
                const lcd = d1 * d2; const num = n1 * d2 + n2 * d1; const whole = Math.floor(num / lcd); const rem = num % lcd;
                return { q: `Add: ${n1}/${d1} + ${n2}/${d2}`, ans: whole > 0 ? `${whole} ${rem}/${lcd}` : `${num}/${lcd}`, distractors: [`${n1+n2}/${d1+d2}`, `${whole > 0 ? whole - 1 : 0} ${rem}/${lcd}`, `${num}/${lcd+1}`], guide: `LCD is ${lcd}. ${n1*d2}/${lcd} + ${n2*d1}/${lcd} = ${num}/${lcd}${whole > 0 ? ` = ${whole} ${rem}/${lcd}` : ''}.` };
            }},
            { type: "Place Value", anchor: "Decimal place value relations.", openEnded: false, gen: () => {
                const tens = rand(1, 5); const ones = rand(1, 9); const tenths = rand(1, 9); const hundredths = rand(1, 9);
                const val = `${tens}${ones}.${tenths}${hundredths}`;
                return { q: `In ${val}, the ${tenths} is in the tenths place. A digit that is 1/10 the value of that ${tenths} would be in which place?`, ans: "hundredths", distractors: ["ones", "tens", "thousandths"], guide: `1/10 of the tenths place is the hundredths place. Each place to the right is 1/10 the value.` };
            }},
            { type: "Rounding", anchor: "Round decimals.", openEnded: false, gen: () => {
                const d1 = rand(1, 9); const d2 = rand(1, 8); const d3 = rand(5, 9);
                const rounded2 = d3 >= 5 ? d2 + 1 : d2;
                return { q: `Round 0.${d1}${d2}${d3} to the nearest hundredth.`, ans: `0.${d1}${rounded2}`, distractors: [`0.${d1}${d2}`, `0.${d1}`, `0.${d1}${d2}${d3}`], guide: `Look at the thousandths digit (${d3}). Since it's ${d3 >= 5 ? '5 or more, round up' : 'less than 5, round down'}.` };
            }},
            { type: "Dec Logic", anchor: "Mixed operations with decimals.", openEnded: false, gen: () => {
                const total = rand(3, 8); const half = total / 2; const d1 = rand(10, 20); const d2 = d1 + rand(2, 5);
                const r1 = half / d1; const r2 = half / d2; const ans = Math.abs(r1 - r2).toFixed(2);
                return { q: `A ${total}kg block is halved. Worker A divides into ${d1} packs, Worker B into ${d2} packs. Mass difference per pack?`, ans: ans, distractors: [(r1+r2).toFixed(2), r1.toFixed(2), r2.toFixed(2)], guide: `${half}/${d1} = ${r1.toFixed(3)}. ${half}/${d2} = ${r2.toFixed(3)}. Difference ≈ ${ans}.` };
            }},
            { type: "Mult Algo", anchor: "Multiply multi-digit numbers.", openEnded: false, gen: () => {
                const a = rand(100, 200); const b = rand(12, 30); const ans = a * b;
                return { q: `Calculate ${a} × ${b}.`, ans: ans.toString(), distractors: [(a*(b-10)).toString(), (a*Math.floor(b/10)*10).toString(), (ans-50).toString()], guide: `${a} × ${b % 10} = ${a*(b%10)}. ${a} × ${Math.floor(b/10)*10} = ${a*Math.floor(b/10)*10}. Sum = ${ans}.` };
            }},
            { type: "Division", anchor: "Divide 4-digits by 2-digits.", openEnded: false, gen: () => {
                const divisor = rand(12, 24); const quotient = rand(20, 50); const total = divisor * quotient;
                return { q: `A person earns $${total} over ${divisor} weeks. How much is earned each week?`, ans: `$${quotient}`, distractors: [`$${quotient-1}`, `$${quotient+2}`, `$${divisor}`], guide: `${total} ÷ ${divisor} = ${quotient}.` };
            }},
            { type: "Frac Mult", anchor: "Real world fraction multiplication.", openEnded: false, gen: () => {
                const portion = rand(3, 6); const total = rand(4, 24); const ans = total * portion;
                return { q: `You have ${total} lbs of turkey. Each sandwich uses 1/${portion} lb. How many sandwiches can you make?`, ans: ans.toString(), distractors: [total.toString(), portion.toString(), (ans-2).toString()], guide: `${total} ÷ 1/${portion} is the same as ${total} × ${portion} = ${ans}.` };
            }},
            { type: "Dec Comp", anchor: "Compare decimals to thousandths.", openEnded: false, gen: () => {
                const w = rand(1, 9); const d1 = rand(1, 9); const d2 = rand(1, 9);
                const v = `${w}.${d1}${d2}`;
                return { q: `Compare ${v}0 and ${v}.`, ans: "Equal", distractors: [`${v}0 is greater`, `${v}0 is less`, "Cannot compare"], guide: `Adding a zero at the end of a decimal doesn't change its value. ${v}0 = ${v}.` };
            }},
            { type: "Powers 10", anchor: "Explain zeros in products with powers of 10.", openEnded: false, gen: () => {
                const v = rand(10, 990) / 10; const p = rand(2, 5); const ans = v * Math.pow(10, p);
                return { q: `What is ${v} × 10<sup>${p}</sup>?`, ans: ans.toString(), distractors: [(v * Math.pow(10, p-1)).toString(), (v * Math.pow(10, p+1)).toString(), (1/ans).toString()], guide: `Move the decimal point ${p} places to the right: ${v} becomes ${ans}.` };
            }},
            { type: "Coordinates", anchor: "Graph points on coordinate plane.", openEnded: false, gen: () => {
                const x = rand(1, 15); const y = rand(1, 15);
                return { q: `In the ordered pair (${x}, ${y}), which number represents the y-coordinate?`, ans: y.toString(), distractors: [x.toString(), (x+y).toString(), "0"], guide: `The first number is X, the second number is Y. So Y = ${y}.` };
            }},
            { type: "Volume", anchor: "Volume of rectangular prisms.", openEnded: false, gen: () => {
                const l = rand(3, 20); const w = rand(2, 12); const h = rand(2, 10); const ans = l * w * h;
                return { q: `Find the volume of a box with length ${l}, width ${w}, and height ${h}.`, ans: ans.toString(), distractors: [(l*w).toString(), (l+w+h).toString(), (2*(l*w+l*h+w*h)).toString()], guide: `V = L × W × H = ${l} × ${w} × ${h} = ${ans}.` };
            }},
            { type: "Base Area", anchor: "Volume using base area.", openEnded: false, gen: () => {
                const b = rand(10, 60); const h = rand(2, 10); const ans = b * h;
                return { q: `A box has a base area of ${b} and a height of ${h}. What is its volume?`, ans: ans.toString(), distractors: [(b+h).toString(), (b-h).toString(), (ans+b).toString()], guide: `Volume = Base Area × Height = ${b} × ${h} = ${ans}.` };
            }},
            { type: "Mult Frac", anchor: "Fraction of a whole.", openEnded: false, gen: () => {
                const d = rand(2, 8); const n = rand(1, d - 1); const w = d * rand(2, 8); const ans = n * w / d;
                return { q: `What is ${n}/${d} of ${w}?`, ans: ans.toString(), distractors: [(w/d).toString(), (w*n).toString(), (ans+1).toString()], guide: `(${w} ÷ ${d}) = ${w/d}. Then multiply by ${n} to get ${ans}.` };
            }},
            { type: "Mixed Sub", anchor: "Subtract mixed numbers.", openEnded: false, gen: () => {
                const w = rand(3, 12); const subW = rand(1, w - 2); const d = rand(3, 10); const n = rand(1, d - 1);
                const ansW = w - subW - 1; const ansN = d - n;
                return { q: `${w} - ${subW} ${n}/${d} = ?`, ans: `${ansW} ${ansN}/${d}`, distractors: [`${subW} ${n}/${d}`, `${ansW} ${n}/${d}`, `${ansW+1} ${ansN}/${d}`], guide: `Think of ${w} as ${w-1} ${d}/${d}. Then ${w-1} ${d}/${d} - ${subW} ${n}/${d} = ${ansW} ${ansN}/${d}.` };
            }},
            { type: "Hierarchy", anchor: "Classify shapes.", openEnded: false, gen: () => {
                return { q: `A square is always a rectangle because it has:`, ans: "4 right angles", distractors: ["4 equal sides", "no parallel lines", "exactly 3 sides"], guide: `The definition of a rectangle is a quadrilateral with four right angles. Squares always meet this rule.` };
            }},
            { type: "Patterns", anchor: "Generate numerical patterns.", openEnded: false, gen: () => {
                const stepA = rand(2, 10); const mult = rand(2, 5); const stepB = stepA * mult;
                return { q: `Rule A adds ${stepA} each time. Rule B adds ${stepB} each time. How do the terms in Rule B relate to Rule A?`, ans: `Rule B terms are ${mult}x Rule A`, distractors: [`Rule B terms are ${mult+1}x Rule A`, `Rule A terms are ${mult}x Rule B`, "No relation"], guide: `Since ${stepB} is ${mult} times ${stepA}, every term in B will be ${mult} times the corresponding term in A.` };
            }},
            { type: "ExpWord", anchor: "A-T.1.1.3", openEnded: false, gen: () => {
                const tens = rand(1, 9); const ones = rand(1, 9); const num = tens * 10 + ones;
                return { q: `Which expression shows ${num} in expanded form?`, ans: `(${tens} × 10) + (${ones} × 1)`, distractors: [`(${ones} × 10) + (${tens} × 1)`, `${tens} + ${ones}`, `${tens} × ${ones}`], guide: `${num} = ${tens} tens and ${ones} ones = (${tens} × 10) + (${ones} × 1).` };
            }},
            { type: "DecDivide", anchor: "A-T.2.1.3", openEnded: false, gen: () => {
                const divisor = rand(2, 5); const quotient = rand(2, 6); const dividend = (divisor * quotient) / 10;
                const divisorDec = divisor / 10;
                return { q: `What is ${dividend} ÷ ${divisorDec}?`, ans: quotient.toString(), distractors: [(quotient + 1).toString(), (quotient - 1).toString(), dividend.toString()], guide: `${dividend} ÷ ${divisorDec}: multiply both by 10 to get ${dividend * 10} ÷ ${divisor} = ${quotient}.` };
            }},
            { type: "OrderOps", anchor: "B-O.1.1.1", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(1, 10); const c = rand(2, 8); const ans = a + b * c;
                return { q: `Evaluate: ${a} + ${b} × ${c}`, ans: ans.toString(), distractors: [((a + b) * c).toString(), (a * b + c).toString(), (a + b + c).toString()], guide: `Order of operations: multiply first. ${b} × ${c} = ${b * c}. Then ${a} + ${b * c} = ${ans}.` };
            }},
            { type: "GraphCtx", anchor: "C-G.1.1.2", openEnded: false, gen: () => {
                const x = rand(1, 15); const y = rand(1, 15);
                return { q: `A point is at (${x}, ${y}) on a coordinate plane. How many units to the right of the origin is it?`, ans: x.toString(), distractors: [y.toString(), (x + y).toString(), (x - 1).toString()], guide: `The x-coordinate tells how far right from the origin. The point is ${x} units to the right.` };
            }},
            { type: "TriClass", anchor: "C-G.2.1.1", openEnded: false, gen: () => {
                return { q: `A triangle with all three sides equal in length is called:`, ans: "Equilateral", distractors: ["Isosceles", "Scalene", "Right"], guide: `An equilateral triangle has all three sides the same length and all three angles equal to 60°.` };
            }},
            { type: "FracDenom", anchor: "A-F.1.1", openEnded: false, gen: () => {
                const d1 = rand(2, 12); const d2 = rand(d1 + 1, 15);
                const lcd = (d1 * d2) / gcd(d1, d2);
                return { q: `What is the least common denominator of fractions with denominators ${d1} and ${d2}?`, ans: lcd.toString(), distractors: [(d1 * d2).toString(), d2.toString(), (lcd + d1).toString()], guide: `Find the LCD of ${d1} and ${d2}. The least common multiple is ${lcd}.` };
            }},
            { type: "ConvInch", anchor: "D-M.1.1.1", openEnded: false, gen: () => {
                const ft = rand(2, 25); const ans = ft * 12;
                return { q: `How many inches are in ${ft} feet?`, ans: ans.toString(), distractors: [(ft * 10).toString(), (ft + 12).toString(), (ans + 12).toString()], guide: `1 foot = 12 inches. ${ft} × 12 = ${ans} inches.` };
            }},
            { type: "LineData", anchor: "D-M.2.1.1", openEnded: false, gen: () => {
                return { q: `On a line plot, if one value has the most X marks above it, that value is the:`, ans: "Mode", distractors: ["Mean", "Median", "Range"], guide: `The mode is the value that appears most frequently. On a line plot, the tallest stack of Xs shows the mode.` };
            }},
            { type: "MultZero", anchor: "A-T.1.1.2", openEnded: false, gen: () => {
                const a = rand(2, 12); const power = rand(2, 5); const multiplier = Math.pow(10, power); const ans = a * multiplier;
                return { q: `What is ${a} × ${multiplier}?`, ans: ans.toString(), distractors: [(a * multiplier / 10).toString(), (a + multiplier).toString(), (ans * 10).toString()], guide: `Multiply ${a} by ${multiplier} by adding ${power} zero${power > 1 ? 's' : ''} to ${a}: ${a} × ${multiplier} = ${ans}.` };
            }},

            // ===== 2024 GRADE 5 SET =====

            { type: "FractionAddition", anchor: "A-F.1.1.1", openEnded: false, gen: () => {
                const n1 = rand(1, 5); const d1 = rand(4, 10); const n2 = rand(1, 5); const d2 = rand(7, 12);
                const num = (n1 * d2) + (n2 * d1); const den = d1 * d2;
                return { q: `Add: ${n1}/${d1} + ${n2}/${d2}`, ans: `${num}/${den}`, distractors: [`${n1 + n2}/${d1 + d2}`, `${num}/${den + 5}`, `${n1}/${den}`], guide: `Find common denominator: ${d1}×${d2}=${den}. New numerators: ${n1 * d2} and ${n2 * d1}. Sum: ${num}/${den}.` };
            }},
            { type: "PlaceValue1_10", anchor: "A-T.1.1.1", openEnded: false, gen: () => {
                const d = rand(1, 9);
                return { q: `In 52.${d}7, the ${d} is in the tenths place. Which place is 1/10 its value?`, ans: "hundredths", distractors: ["ones", "tens", "thousandths"], guide: "Each place to the right is 1/10 the value of the place to its left." };
            }},
            { type: "DecimalRounding", anchor: "A-T.1.1.5", openEnded: false, gen: () => {
                const v = rand(100, 999) / 10000;
                return { q: `Round ${v.toFixed(5)} to the nearest thousandth.`, ans: v.toFixed(3), distractors: [v.toFixed(2), v.toFixed(4), v.toFixed(1)], guide: "Look at the 4th decimal digit to determine if you round up or stay." };
            }},
            { type: "DecimalLogic", anchor: "A-T.2.1", openEnded: false, gen: () => {
                const total = rand(8, 12); const d1 = 15; const d2 = 20;
                const v1 = total / d1; const v2 = total / d2;
                return { q: `A ${total}kg block is split into ${d1} packs and then ${d2} packs. Difference per pack?`, ans: (v1 - v2).toFixed(2), distractors: [v1.toFixed(2), v2.toFixed(2), (v1 + v2).toFixed(2)], guide: `${total}/${d1}=${v1.toFixed(2)}. ${total}/${d2}=${v2.toFixed(2)}. Difference: ${(v1 - v2).toFixed(2)}.` };
            }},
            { type: "MultAlgo", anchor: "A-T.2.1.1", openEnded: false, gen: () => {
                const a = rand(100, 500); const b = rand(11, 49);
                return { q: `Calculate ${a} × ${b}`, ans: (a * b).toString(), distractors: [(a * (b - 1)).toString(), (a * 10).toString(), (a * b - 100).toString()], guide: `Standard algorithm: ${a} × ${b % 10} plus ${a} × ${b - b % 10}.` };
            }},
            { type: "Div4x2", anchor: "A-T.2.1.2", openEnded: false, gen: () => {
                const q = rand(15, 65); const d = 18;
                return { q: `$${q * d} earned over ${d} weeks. Weekly?`, ans: q.toString(), distractors: [(q - 5).toString(), (q + 2).toString(), d.toString()], guide: `Total divided by weeks: ${q * d} ÷ ${d} = ${q}.` };
            }},
            { type: "FracDivWord", anchor: "A-F.2.1", openEnded: false, gen: () => {
                const w = rand(4, 24); const p = 4;
                return { q: `${w} lbs turkey, 1/${p} lb per sandwich. Total sandwiches?`, ans: (w * p).toString(), distractors: [w.toString(), p.toString(), (w / p).toString()], guide: `${w} ÷ 1/${p} is the same as ${w} × ${p} = ${w * p}.` };
            }},
            { type: "DecimalEquality", anchor: "A-T.1.1.4", openEnded: false, gen: () => {
                const v = rand(1, 9);
                return { q: `Compare 4.${v}0 and 4.${v}.`, ans: "Equal", distractors: ["Greater", "Less", "Unknown"], guide: "Trailing zeros after a decimal do not change the value." };
            }},
            { type: "Power10", anchor: "A-T.1.1.2", openEnded: false, gen: () => {
                const v = rand(41, 49) / 10; const p = 3;
                return { q: `${v} × 10^${p} = ?`, ans: (v * 1000).toString(), distractors: [(v * 100).toString(), "0.0045", (v * 10000).toString()], guide: "Multiplying by 10^3 shifts the decimal 3 places right." };
            }},
            { type: "YCoord", anchor: "C-G.1.1", openEnded: false, gen: () => {
                const x = rand(1, 15); const y = rand(1, 15);
                return { q: `In point (${x}, ${y}), what is the y-coordinate?`, ans: y.toString(), distractors: [x.toString(), "0", (x + y).toString()], guide: "The second number in an ordered pair is always Y." };
            }},
            { type: "RectVol", anchor: "B-O.3.1.1", openEnded: false, gen: () => {
                const l = rand(4, 20); const w = rand(2, 10); const h = 2;
                return { q: `Volume of ${l}x${w}x${h} box?`, ans: (l * w * h).toString(), distractors: [(l * w).toString(), (l + w + h).toString(), (l * w * h / 2).toString()], guide: `L × W × H = ${l} × ${w} × ${h} = ${l * w * h}.` };
            }},
            { type: "BaseAreaVol", anchor: "B-O.3.1.2", openEnded: false, gen: () => {
                const b = rand(10, 60); const h = rand(2, 10);
                return { q: `Base area ${b}, height ${h}. Volume?`, ans: (b * h).toString(), distractors: [(b + h).toString(), b.toString(), h.toString()], guide: `Volume = Base Area × Height = ${b} × ${h}.` };
            }},
            { type: "FracOfWhole", anchor: "A-F.2.1.2", openEnded: false, gen: () => {
                const w = rand(3, 10) * 3;
                return { q: `What is 2/3 of ${w}?`, ans: (w / 3 * 2).toString(), distractors: [(w / 3).toString(), (w * 2).toString(), (w - 3).toString()], guide: `(${w} ÷ 3) × 2 = ${w / 3 * 2}.` };
            }},
            { type: "MixedSub", anchor: "A-F.1.1.1", openEnded: false, gen: () => {
                const w = rand(4, 12);
                return { q: `${w} - 2 1/3 = ?`, ans: `${w - 3} 2/3`, distractors: [`${w - 2} 1/3`, `${w - 2} 2/3`, `${w - 3} 1/3`], guide: `Borrow from whole: ${w - 1} 3/3 - 2 1/3 = ${w - 3} 2/3.` };
            }},
            { type: "Hierarchy", anchor: "C-G.2.1.1", openEnded: false, gen: () => ({
                q: "Which property makes a square a rectangle?", ans: "4 right angles", distractors: ["4 equal sides", "No parallel lines", "3 sides"], guide: "A rectangle is any quadrilateral with four 90-degree angles."
            })},
            { type: "PatternRel", anchor: "B-O.1.1.2", openEnded: false, gen: () => {
                const a = rand(2, 8); const b = a * 2;
                return { q: `Rule A: +${a}, Rule B: +${b}. B is __ times A?`, ans: "2", distractors: ["3", "4", "0"], guide: `${b} is exactly twice ${a}.` };
            }},

            // ===== 2023 GRADE 5 SET =====

            { type: "FracSub5", anchor: "A-F.1", openEnded: false, gen: () => ({
                q: "7/10 - 2/5 = ?", ans: "3/10", distractors: ["5/5", "5/10", "9/10"], guide: "7/10 - 4/10 = 3/10."
            })},
            { type: "OrderOps5", anchor: "B-O.1.1.1", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 8);
                return { q: `(${a} + ${b}) × 2 = ?`, ans: ((a + b) * 2).toString(), distractors: [(a + b * 2).toString(), (a + b).toString(), "20"], guide: `Solve parenthesis first: ${a + b} × 2 = ${(a + b) * 2}.` };
            }},
            { type: "DecMult5", anchor: "A-T.2.1.1", openEnded: false, gen: () => ({
                q: "0.5 × 0.8 = ?", ans: "0.4", distractors: ["4.0", "0.04", "1.3"], guide: "5 × 8 = 40. Shift decimal two spots."
            })},
            { type: "TriClass5", anchor: "C-G.2.1.1", openEnded: false, gen: () => ({
                q: "Triangle with no equal sides?", ans: "Scalene", distractors: ["Isosceles", "Equilateral", "Right"], guide: "Scalene triangles have 3 different side lengths."
            })},
            { type: "UnitConv", anchor: "D-M.1.1.1", openEnded: false, gen: () => {
                const f = rand(2, 25);
                return { q: `${f} feet = __ inches?`, ans: (f * 12).toString(), distractors: [(f * 10).toString(), "12", (f + 12).toString()], guide: `${f} × 12 = ${f * 12}.` };
            }},
            { type: "DecimalDiv5", anchor: "A-T.2.1.3", openEnded: false, gen: () => ({
                q: "2.4 ÷ 0.6 = ?", ans: "4", distractors: ["0.4", "40", "1.8"], guide: "How many 6s in 24?"
            })},
            { type: "LineData5", anchor: "D-M.2.1.1", openEnded: false, gen: () => ({
                q: "If a plot has 4 dots at 1/2 lb, total weight?", ans: "2 lbs", distractors: ["4 lbs", "1/2 lb", "1 lb"], guide: "4 × 1/2 = 2."
            })},
            { type: "Power10Pattern", anchor: "A-T.1.1.2", openEnded: false, gen: () => ({
                q: "100 × 0.007 = ?", ans: "0.7", distractors: ["0.07", "7", "0.0007"], guide: "Move decimal 2 spots right."
            })},
            { type: "VolUnitCubes", anchor: "B-O.3.1.1", openEnded: false, gen: () => ({
                q: "A box holds 2 layers of 12 cubes. Volume?", ans: "24", distractors: ["14", "12", "48"], guide: "2 × 12 = 24."
            })},
            { type: "LCDSearch", anchor: "A-F.1.1", openEnded: false, gen: () => ({
                q: "LCD for 1/4 and 1/6?", ans: "12", distractors: ["24", "10", "2"], guide: "12 is the smallest multiple of both."
            })},
            { type: "ExpFormWord", anchor: "A-T.1.1.3", openEnded: false, gen: () => ({
                q: "What is (5 x 10) + (3 x 0.1)?", ans: "50.3", distractors: ["5.3", "503", "50.03"], guide: "50 + 0.3 = 50.3."
            })},
            { type: "CoordinateDist", anchor: "C-G.1.1.2", openEnded: false, gen: () => ({
                q: "Distance from (2,3) to (2,7)?", ans: "4", distractors: ["2", "10", "5"], guide: "Subtract Y values: 7 - 3 = 4."
            })},
            { type: "DecimalComp", anchor: "A-T.1.1.4", openEnded: false, gen: () => ({
                q: "Which is largest? 0.4, 0.405, 0.045", ans: "0.405", distractors: ["0.4", "0.045", "Equal"], guide: "Compare place values: 0.405 is the most."
            })},
            { type: "MultWholeFrac", anchor: "A-F.2.1.3", openEnded: false, gen: () => ({
                q: "1/5 × 20 = ?", ans: "4", distractors: ["100", "25", "5"], guide: "20 ÷ 5 = 4."
            })},
            { type: "Parallelogram5", anchor: "C-G.2", openEnded: false, gen: () => ({
                q: "Do all parallelograms have 4 right angles?", ans: "No", distractors: ["Yes", "Only squares", "Only rhombi"], guide: "Only rectangles and squares have 4 right angles."
            })},
            { type: "RoundingTenth", anchor: "A-T.1.1.5", openEnded: false, gen: () => ({
                q: "Round 5.24 to nearest tenth.", ans: "5.2", distractors: ["5.3", "5.0", "5.25"], guide: "4 is less than 5, stay at 0.2."
            })},
            { type: "MultiplyDecimals", anchor: "Multiply two decimal numbers.", openEnded: false, gen: () => {
                const a = rand(11, 99); const b = rand(11, 99);
                const product = a * b;
                const ans = (product / 100).toFixed(2);
                const aD = (a / 10).toFixed(1); const bD = (b / 10).toFixed(1);
                const wrong1 = (product / 10).toFixed(1);
                const wrong2 = (product / 1000).toFixed(3);
                const wrong3 = ((a * b + 10) / 100).toFixed(2);
                return { q: `Calculate ${aD} × ${bD}.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Multiply ignoring decimals: ${a} × ${b} = ${product}. Count 2 total decimal places → ${ans}.` };
            }},
            { type: "DivideDecimals", anchor: "Divide two decimal numbers.", openEnded: false, gen: () => {
                const quotient = rand(2, 25); const divisor = rand(2, 9);
                const dividend = quotient * divisor;
                const aD = (dividend / 10).toFixed(1); const bD = (divisor / 10).toFixed(1);
                const ans = (quotient / 1).toFixed(1);
                const wrong1 = (quotient * 10).toFixed(0);
                const wrong2 = (quotient / 10).toFixed(2);
                const wrong3 = (quotient + 1).toFixed(1);
                return { q: `Calculate ${aD} ÷ ${bD}.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Move decimal 1 place in both: ${dividend} ÷ ${divisor} = ${quotient}. So ${aD} ÷ ${bD} = ${ans}.` };
            }},
            { type: "LongDivision2Digit", anchor: "Divide 3-4 digit numbers by a 2-digit divisor.", openEnded: false, gen: () => {
                const divisor = rand(12, 49); const quotient = rand(11, 99);
                const remainder = rand(0, divisor - 1);
                const dividend = divisor * quotient + remainder;
                const ans = remainder === 0 ? quotient.toString() : `${quotient} R${remainder}`;
                const wrong1 = remainder === 0 ? (quotient + 1).toString() : `${quotient + 1} R${remainder}`;
                const wrong2 = remainder === 0 ? (quotient - 1).toString() : `${quotient} R${remainder + 1}`;
                const wrong3 = (quotient * 2).toString();
                return { q: `Calculate ${dividend} ÷ ${divisor}.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `${divisor} × ${quotient} = ${divisor * quotient}${remainder > 0 ? ` with remainder ${remainder}` : ''}. So ${dividend} ÷ ${divisor} = ${ans}.` };
            }},
            { type: "MultiplyFractions", anchor: "Multiply fractions and simplify.", openEnded: false, gen: () => {
                const n1 = rand(1, 9); const d1 = rand(2, 10); const n2 = rand(1, 9); const d2 = rand(2, 10);
                const rn = n1 * n2; const rd = d1 * d2; const g = gcd(rn, rd);
                const sn = rn / g; const sd = rd / g;
                const whole = Math.floor(sn / sd); const rem = sn % sd;
                const ans = sd === 1 ? sn.toString() : (whole > 0 ? (rem > 0 ? `${whole} ${rem}/${sd}` : whole.toString()) : `${sn}/${sd}`);
                const wrong1 = `${n1 + n2}/${d1 + d2}`;
                const wrong2 = `${rn}/${rd}`;
                const wrong3 = sd === 1 ? (sn + 1).toString() : `${sn + 1}/${sd}`;
                return { q: `Multiply: ${n1}/${d1} × ${n2}/${d2}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Multiply numerators: ${n1} × ${n2} = ${rn}. Multiply denominators: ${d1} × ${d2} = ${rd}. Simplify ${rn}/${rd} = ${ans}.` };
            }},
            { type: "DivideFractions", anchor: "Divide fractions using reciprocals.", openEnded: false, gen: () => {
                const n1 = rand(1, 9); const d1 = rand(2, 10); const n2 = rand(1, 9); const d2 = rand(2, 10);
                const rn = n1 * d2; const rd = d1 * n2; const g = gcd(rn, rd);
                const sn = rn / g; const sd = rd / g;
                const whole = Math.floor(sn / sd); const rem = sn % sd;
                const ans = sd === 1 ? sn.toString() : (whole > 0 ? (rem > 0 ? `${whole} ${rem}/${sd}` : whole.toString()) : `${sn}/${sd}`);
                const wrong1 = `${n1 * n2}/${d1 * d2}`;
                const wrong2 = `${rd}/${rn}`;
                const wrong3 = sd === 1 ? (sn + 1).toString() : `${sn + 1}/${sd}`;
                return { q: `Divide: ${n1}/${d1} ÷ ${n2}/${d2}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Multiply by the reciprocal: ${n1}/${d1} × ${d2}/${n2} = ${rn}/${rd}. Simplify to ${ans}.` };
            }},
            { type: "MultiplyMixed", anchor: "Multiply mixed numbers.", openEnded: false, gen: () => {
                const w1 = rand(1, 5); const n1 = rand(1, 3); const d1 = rand(n1 + 1, 6);
                const whole2 = rand(2, 9);
                const imp1 = w1 * d1 + n1;
                const rn = imp1 * whole2; const rd = d1; const g = gcd(rn, rd);
                const sn = rn / g; const sd = rd / g;
                const wholeAns = Math.floor(sn / sd); const rem = sn % sd;
                const ans = rem > 0 ? `${wholeAns} ${rem}/${sd}` : wholeAns.toString();
                const wrong1 = `${w1 * whole2} ${n1}/${d1}`;
                const wrong2 = (wholeAns + 1).toString();
                const wrong3 = rem > 0 ? `${wholeAns + 1} ${rem}/${sd}` : (wholeAns - 1).toString();
                return { q: `Multiply: ${w1} ${n1}/${d1} × ${whole2}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Convert to improper: ${imp1}/${d1}. Multiply: ${imp1} × ${whole2} = ${rn}. So ${rn}/${rd} = ${ans}.` };
            }},
            { type: "AddMixedNumbers", anchor: "Add two mixed numbers.", openEnded: false, gen: () => {
                const w1 = rand(1, 6); const w2 = rand(1, 6);
                const d = choose([3, 4, 5, 6, 8]);
                const n1 = rand(1, d - 1); const n2 = rand(1, d - 1);
                const totalN = n1 + n2; const extraWhole = Math.floor(totalN / d); const remN = totalN % d;
                const wholeAns = w1 + w2 + extraWhole;
                const g = remN > 0 ? gcd(remN, d) : 1;
                const ans = remN > 0 ? `${wholeAns} ${remN / g}/${d / g}` : wholeAns.toString();
                const wrong1 = `${w1 + w2} ${n1 + n2}/${d}`;
                const wrong2 = `${wholeAns + 1} ${remN}/${d}`;
                const wrong3 = `${w1 + w2} ${n1 + n2}/${d * 2}`;
                return { q: `Add: ${w1} ${n1}/${d} + ${w2} ${n2}/${d}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Add wholes: ${w1} + ${w2} = ${w1 + w2}. Add fractions: ${n1}/${d} + ${n2}/${d} = ${totalN}/${d}${extraWhole > 0 ? ` = ${extraWhole} ${remN}/${d}` : ''}. Total = ${ans}.` };
            }},
            { type: "SubtractMixedNumbers", anchor: "Subtract mixed numbers.", openEnded: false, gen: () => {
                const d = choose([3, 4, 5, 6, 8]);
                const n2 = rand(1, d - 1);
                const n1raw = rand(1, d - 1);
                const w2 = rand(1, 5); const w1 = w2 + rand(1, 4);
                const borrow = n1raw < n2 ? 1 : 0;
                const adjN1 = borrow ? n1raw + d : n1raw;
                const adjW1 = w1 - borrow;
                const resN = adjN1 - n2; const resW = adjW1 - w2;
                const g = resN > 0 ? gcd(resN, d) : 1;
                const ans = resN > 0 ? (resW > 0 ? `${resW} ${resN / g}/${d / g}` : `${resN / g}/${d / g}`) : resW.toString();
                const wrong1 = `${w1 - w2} ${Math.abs(n1raw - n2)}/${d}`;
                const wrong2 = resW > 0 ? `${resW + 1} ${resN}/${d}` : `1 ${resN}/${d}`;
                const wrong3 = `${w1 - w2} ${n1raw}/${d}`;
                return { q: `Subtract: ${w1} ${n1raw}/${d} − ${w2} ${n2}/${d}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `${borrow ? `Borrow 1 from ${w1}: ${adjW1} ${adjN1}/${d} − ${w2} ${n2}/${d}. ` : ''}Wholes: ${adjW1} − ${w2} = ${resW}. Fractions: ${adjN1}/${d} − ${n2}/${d} = ${resN}/${d}. Answer = ${ans}.` };
            }},
            { type: "SimplifyFractions", anchor: "Reduce a fraction to lowest terms.", openEnded: false, gen: () => {
                const sn = rand(1, 12); const sd = rand(sn + 1, 15);
                const g0 = gcd(sn, sd);
                const simpN = sn / g0; const simpD = sd / g0;
                const mult = rand(2, 6);
                const bigN = simpN * mult; const bigD = simpD * mult;
                const ans = `${simpN}/${simpD}`;
                const wrong1 = `${bigN - 1}/${bigD}`;
                const wrong2 = `${simpN}/${simpD + 1}`;
                const wrong3 = `${bigN}/${bigD}`;
                return { q: `Simplify: ${bigN}/${bigD}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `GCF of ${bigN} and ${bigD} is ${mult * g0}. Divide both: ${bigN} ÷ ${mult * g0} = ${simpN}, ${bigD} ÷ ${mult * g0} = ${simpD}. Answer: ${ans}.` };
            }},
            { type: "FractionDecimalPercent", anchor: "Convert fraction to decimal to percent.", openEnded: false, gen: () => {
                const pairs = [{n:1,d:4,dec:"0.25",pct:"25%"},{n:1,d:2,dec:"0.5",pct:"50%"},{n:3,d:4,dec:"0.75",pct:"75%"},{n:1,d:5,dec:"0.2",pct:"20%"},{n:2,d:5,dec:"0.4",pct:"40%"},{n:3,d:5,dec:"0.6",pct:"60%"},{n:4,d:5,dec:"0.8",pct:"80%"},{n:1,d:8,dec:"0.125",pct:"12.5%"},{n:3,d:8,dec:"0.375",pct:"37.5%"},{n:1,d:10,dec:"0.1",pct:"10%"},{n:3,d:10,dec:"0.3",pct:"30%"},{n:7,d:10,dec:"0.7",pct:"70%"}];
                const p = choose(pairs);
                const mode = rand(0, 1);
                if (mode === 0) {
                    return { q: `Convert ${p.n}/${p.d} to a decimal.`, ans: p.dec, distractors: [p.pct, (p.n / p.d + 0.1).toFixed(2), (p.n / p.d * 10).toFixed(1)], guide: `Divide ${p.n} ÷ ${p.d} = ${p.dec}.` };
                } else {
                    return { q: `Convert ${p.n}/${p.d} to a percent.`, ans: p.pct, distractors: [p.dec, ((p.n / p.d) * 10).toFixed(0) + "%", ((p.n / p.d) * 1000).toFixed(0) + "%"], guide: `${p.n} ÷ ${p.d} = ${p.dec}. Multiply by 100 → ${p.pct}.` };
                }
            }},
            { type: "PercentOfNumber", anchor: "Find a percent of a number.", openEnded: false, gen: () => {
                const pct = choose([10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
                const whole = rand(2, 20) * 10;
                const ans = (pct / 100 * whole);
                const wrong1 = (pct / 10 * whole);
                const wrong2 = ans + whole / 10;
                const wrong3 = ans - whole / 10;
                return { q: `What is ${pct}% of ${whole}?`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${pct}% = ${pct / 100}. Multiply: ${pct / 100} × ${whole} = ${ans}.` };
            }},
            { type: "DecimalPlaceValue", anchor: "Identify digits in decimal place values.", openEnded: false, gen: () => {
                const d1 = rand(1, 9); const d2 = rand(0, 9); const d3 = rand(1, 9); const d4 = rand(1, 9);
                const val = `${d1}.${d2}${d3}${d4}`;
                const places = ["tenths", "hundredths", "thousandths"];
                const digits = [d2, d3, d4];
                const idx = rand(0, 2);
                const ans = digits[idx].toString();
                const others = digits.filter((_, i) => i !== idx);
                const wrong3 = d1.toString();
                return { q: `In ${val}, what digit is in the ${places[idx]} place?`, ans: ans, distractors: [others[0].toString(), others[1].toString(), wrong3], guide: `In ${val}: tenths = ${d2}, hundredths = ${d3}, thousandths = ${d4}. The ${places[idx]} digit is ${ans}.` };
            }},
            { type: "ExponentEvaluate", anchor: "Evaluate a number raised to a power.", openEnded: false, gen: () => {
                const base = rand(2, 10); const exp = rand(2, 4);
                const ans = Math.pow(base, exp);
                const wrong1 = base * exp;
                const wrong2 = Math.pow(base, exp - 1);
                const wrong3 = ans + base;
                return { q: `Evaluate: ${base}^${exp}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${base}^${exp} means ${base} multiplied ${exp} times: ${Array(exp).fill(base).join(' × ')} = ${ans}.` };
            }},
            { type: "VolumeRectPrism", anchor: "Find volume of a rectangular prism.", openEnded: false, gen: () => {
                const l = rand(2, 12); const w = rand(2, 10); const h = rand(2, 8);
                const ans = l * w * h;
                const wrong1 = l * w + h;
                const wrong2 = 2 * (l * w + l * h + w * h);
                const wrong3 = l * w * h + l;
                return { q: `Find the volume of a rectangular prism with length ${l}, width ${w}, and height ${h}.`, ans: `${ans} cubic units`, distractors: [`${wrong1} cubic units`, `${wrong2} cubic units`, `${wrong3} cubic units`], guide: `Volume = l × w × h = ${l} × ${w} × ${h} = ${ans} cubic units.` };
            }},
            { type: "NumericalExpressions", anchor: "Evaluate expressions with parentheses.", openEnded: false, gen: () => {
                const a = rand(2, 9); const b = rand(1, 6); const c = rand(2, 5); const d = rand(1, 9);
                const ans = (a + b) * c + d;
                const wrong1 = a + b * c + d;
                const wrong2 = (a + b) * (c + d);
                const wrong3 = (a + b) * c - d;
                return { q: `Evaluate: (${a} + ${b}) × ${c} + ${d}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `Parentheses first: ${a} + ${b} = ${a + b}. Multiply: ${a + b} × ${c} = ${(a + b) * c}. Add: ${(a + b) * c} + ${d} = ${ans}.` };
            }},
            { type: "OrderOfOps5", anchor: "Use order of operations with exponents.", openEnded: false, gen: () => {
                const a = rand(2, 5); const b = rand(1, 4); const c = rand(2, 6);
                const ans = Math.pow(a, 2) + b * c;
                const wrong1 = Math.pow(a + b, 2) * c;
                const wrong2 = a * 2 + b * c;
                const wrong3 = Math.pow(a, 2) * b + c;
                return { q: `Evaluate: ${a}² + ${b} × ${c}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `Exponent first: ${a}² = ${a * a}. Multiply: ${b} × ${c} = ${b * c}. Add: ${a * a} + ${b * c} = ${ans}.` };
            }},
            { type: "GCFFind", anchor: "Find the greatest common factor.", openEnded: false, gen: () => {
                const g = rand(2, 12); const m1 = rand(2, 8); const m2 = rand(m1 + 1, 12);
                const a = g * m1; const b = g * m2;
                const ans = gcd(a, b);
                const wrong1 = (a * b / ans).toString();
                const wrong2 = Math.min(a, b).toString();
                const wrong3 = (ans - 1).toString();
                return { q: `Find the GCF of ${a} and ${b}.`, ans: ans.toString(), distractors: [wrong1, wrong2, wrong3], guide: `Factors of ${a}: list them. Factors of ${b}: list them. The greatest common factor is ${ans}.` };
            }},
            { type: "LCMFind", anchor: "Find the least common multiple.", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(a + 1, 15);
                const g = gcd(a, b); const lcm = a * b / g;
                const wrong1 = (a * b).toString();
                const wrong2 = (lcm + a).toString();
                const wrong3 = Math.max(a, b).toString();
                return { q: `Find the LCM of ${a} and ${b}.`, ans: lcm.toString(), distractors: [wrong1, wrong2, wrong3], guide: `Multiples of ${a}: ${a}, ${a*2}, ${a*3}... Multiples of ${b}: ${b}, ${b*2}, ${b*3}... The LCM is ${lcm}.` };
            }},
            { type: "EquivalentFractions", anchor: "Find an equivalent fraction.", openEnded: false, gen: () => {
                const n = rand(1, 9); const d = rand(n + 1, 12);
                const g0 = gcd(n, d); const sn = n / g0; const sd = d / g0;
                const mult = rand(2, 7);
                const bigN = sn * mult; const bigD = sd * mult;
                const mode = rand(0, 1);
                if (mode === 0) {
                    const ans = `${bigN}/${bigD}`;
                    const wrong1 = `${bigN + 1}/${bigD}`;
                    const wrong2 = `${sn}/${bigD}`;
                    const wrong3 = `${bigN}/${sd}`;
                    return { q: `Find a fraction equivalent to ${sn}/${sd} with denominator ${bigD}.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `${sd} × ${mult} = ${bigD}, so multiply numerator too: ${sn} × ${mult} = ${bigN}. Answer: ${ans}.` };
                } else {
                    const ans = `${sn}/${sd}`;
                    const wrong1 = `${sn + 1}/${sd}`;
                    const wrong2 = `${bigN}/${sd}`;
                    const wrong3 = `${sn}/${sd + 1}`;
                    return { q: `Simplify ${bigN}/${bigD} to find an equivalent fraction.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Divide both by ${mult}: ${bigN} ÷ ${mult} = ${sn}, ${bigD} ÷ ${mult} = ${sd}. Answer: ${ans}.` };
                }
            }},
            { type: "CompareDecimals", anchor: "Compare two decimals using <, >, or =.", openEnded: false, gen: () => {
                const a1 = rand(1, 9); const a2 = rand(0, 9); const a3 = rand(0, 9);
                const b1 = a1; const b2 = rand(0, 9); const b3 = rand(0, 9);
                const aVal = a1 + a2 / 10 + a3 / 100; const bVal = b1 + b2 / 10 + b3 / 100;
                const aStr = `${a1}.${a2}${a3}`; const bStr = `${b1}.${b2}${b3}`;
                const ans = aVal > bVal ? ">" : (aVal < bVal ? "<" : "=");
                const symbols = [">", "<", "="];
                const wrongs = symbols.filter(s => s !== ans);
                return { q: `Compare: ${aStr} ___ ${bStr}`, ans: ans, distractors: [wrongs[0], wrongs[1], "≠"], guide: `Compare digit by digit: ${aStr} vs ${bStr}. ${aStr} ${ans} ${bStr}.` };
            }}
        ],
        6: [
            { type: "Div Frac", anchor: "Divide fractions.", openEnded: false, gen: () => {
                const n1 = rand(2, 15); const d1 = rand(n1+1, 20); const n2 = rand(1, 10); const d2 = rand(n2+1, 16);
                const rn = n1 * d2; const rd = d1 * n2; const g = gcd(rn, rd); const sn = rn/g; const sd = rd/g;
                const whole = Math.floor(sn/sd); const rem = sn % sd;
                const ans = whole > 0 ? (rem > 0 ? `${whole} ${rem}/${sd}` : whole.toString()) : `${sn}/${sd}`;
                return { q: `${n1}/${d1} ÷ ${n2}/${d2} = ?`, ans: ans, distractors: [`${n1*n2}/${d1*d2}`, `${d1}/${n1}`, `${n2}/${d2}`], guide: `Flip and multiply: ${n1}/${d1} × ${d2}/${n2} = ${rn}/${rd} = ${ans}.` };
            }},
            { type: "GCF", anchor: "GCF of factorizations.", openEnded: false, gen: () => {
                const a = rand(6, 120); const b = rand(6, 120); const g = gcd(a, b);
                return { q: `What is the greatest common factor of ${a} and ${b}?`, ans: g.toString(), distractors: [(a*b).toString(), Math.min(a,b).toString(), "1"], guide: `List factors of both and find the largest shared one. GCF(${a}, ${b}) = ${g}.` };
            }},
            { type: "Number Line", anchor: "Opposite directions on number line.", openEnded: false, gen: () => {
                return { q: `One bank account balance is positive and another is negative. Where are they located on a number line?`, ans: "Opposite sides of 0", distractors: ["Same side of 0", "Both at 0", "To the right of 10"], guide: `Positive numbers are always to the right of zero, and negatives are to the left.` };
            }},
            { type: "Comp Integers", anchor: "Order rational numbers.", openEnded: false, gen: () => {
                const neg = -rand(50, 999); const pos = rand(20, 800);
                return { q: `Compare ${neg} and ${pos}.`, ans: `${neg} < ${pos}`, distractors: [`${neg} > ${pos}`, `${neg} = ${pos}`, `${pos} < 0`], guide: `Any negative number is always less than any positive number.` };
            }},
            { type: "Ratio Lang", anchor: "Use ratio language.", openEnded: false, gen: () => {
                const a = rand(2, 15); const b = rand(2, 12);
                const item1 = choose(["paintings", "cats", "apples", "boys"]);
                const item2 = choose(["photos", "dogs", "oranges", "girls"]);
                return { q: `The ratio of ${item1} to ${item2} is ${a}:${b}. What does this mean?`, ans: `${a} ${item1} for every ${b} ${item2}`, distractors: [`${b} ${item1} for every ${a} ${item2}`, `${a-b} more ${item2}`, `${a+b} total`], guide: `The order of the ratio must match the order of the items: ${a} corresponds to ${item1}.` };
            }},
            { type: "Rate Table", anchor: "Unit rate from tables.", openEnded: false, gen: () => {
                const rate = rand(2, 15); const time1 = rand(10, 60); const cost1 = rate * time1; const time2 = rand(80, 500);
                const ans = rate * time2;
                return { q: `If ${time1} minutes costs $${(cost1/100).toFixed(2)}, how much does ${time2} minutes cost?`, ans: `$${(ans/100).toFixed(2)}`, distractors: [`$${((ans-50)/100).toFixed(2)}`, `$${((ans+100)/100).toFixed(2)}`, `$${(cost1/100).toFixed(2)}`], guide: `Rate = $${(cost1/100).toFixed(2)} / ${time1} = $${(rate/100).toFixed(4)}/min. × ${time2} = $${(ans/100).toFixed(2)}.` };
            }},
            { type: "Comp Rates", anchor: "Unit price problems.", openEnded: false, gen: () => {
                const r1 = rand(7, 25); const r2 = rand(2, 10); const hrs = rand(2, 12); const ans = (r1 - r2) * hrs;
                return { q: `Group A picks ${r1} per hour. Group B picks ${r2} per hour. What is the difference in total picked after ${hrs} hours?`, ans: ans.toString(), distractors: [(r1-r2).toString(), (r1*hrs).toString(), (r2*hrs).toString()], guide: `Difference per hour = ${r1} - ${r2} = ${r1-r2}. Total difference = ${r1-r2} × ${hrs} = ${ans}.` };
            }},
            { type: "Equations", anchor: "Solve 1-step equations.", openEnded: false, gen: () => {
                const ans = rand(10, 150) / 10; const part = rand(10, 120) / 10; const total = +(ans + part).toFixed(1);
                return { q: `Total weight is ${total} lbs. One item is ${part} lbs. What is the weight of the other?`, ans: ans.toFixed(1), distractors: [total.toString(), (ans+1).toFixed(1), part.toString()], guide: `Subtract: ${total} - ${part} = ${ans.toFixed(1)}.` };
            }},
            { type: "Variables", anchor: "Use variables in context.", openEnded: false, gen: () => {
                const fee = rand(20, 200); const perPerson = rand(2, 12); const teachers = rand(2, 10);
                return { q: `In the expression ${fee} + ${perPerson}(${teachers} + x), if ${teachers} is the number of teachers, what does x most likely represent?`, ans: "number of students", distractors: ["total cost", "the fee", "number of days"], guide: `In the grouping (${teachers} + x), x is being added to the count of people (teachers), so it's students.` };
            }},
            { type: "Trap Area", anchor: "Area of trapezoids.", openEnded: false, gen: () => {
                const h = rand(5, 80); const b1 = rand(15, 120); const b2 = rand(40, 250); const ans = 0.5 * h * (b1 + b2);
                return { q: `Find the area of a trapezoid with height ${h} and bases ${b1} and ${b2}.`, ans: ans.toString(), distractors: [(h*(b1+b2)).toString(), (h*b1).toString(), (b1+b2).toString()], guide: `Area = 1/2 × ${h} × (${b1} + ${b2}) = ${h/2} × ${b1+b2} = ${ans}.` };
            }},
            { type: "Surf Area", anchor: "Nets for surface area.", openEnded: false, gen: () => {
                const l = rand(4, 25); const w = rand(2, 15); const h = rand(2, 15); const ans = 2*(l*w + l*h + w*h);
                return { q: `Calculate the surface area of a ${l}×${w}×${h} rectangular prism.`, ans: ans.toString(), distractors: [(l*w*h).toString(), (l*w+l*h+w*h).toString(), (2*l*w).toString()], guide: `SA = 2(${l*w} + ${l*h} + ${w*h}) = 2(${l*w+l*h+w*h}) = ${ans}.` };
            }},
            { type: "Box Plot", anchor: "Find median in data.", openEnded: false, gen: () => {
                const mid1 = rand(30, 150); const mid2 = mid1 + rand(2, 30); const ans = (mid1 + mid2) / 2;
                return { q: `In a data set, the two middle values are ${mid1} and ${mid2}. What is the median?`, ans: ans.toString(), distractors: [mid1.toString(), mid2.toString(), (mid1+mid2).toString()], guide: `Average the two middle numbers: (${mid1} + ${mid2}) / 2 = ${ans}.` };
            }},
            { type: "MAD", anchor: "Mean Absolute Deviation.", openEnded: false, gen: () => {
                const sum = rand(10, 80); const n = rand(4, 15);
                return { q: `If the total distance of all values from the mean is ${sum} and there are ${n} values, which expression finds the MAD?`, ans: `${sum} ÷ ${n}`, distractors: [`${sum} × ${n}`, `${sum} + ${n}`, `${n} ÷ ${sum}`], guide: `MAD = (Sum of distances) / (Number of values) = ${sum} ÷ ${n}.` };
            }},
            { type: "Histogram", anchor: "Interpret histograms.", openEnded: false, gen: () => {
                return { q: `If an interval on a histogram has a frequency of 0, what does this represent in the data?`, ans: "a gap", distractors: ["a peak", "symmetry", "the mean"], guide: `Zero frequency means no data points fall in that range, creating a visual gap.` };
            }},
            { type: "Stats Question", anchor: "Identify statistical questions.", openEnded: false, gen: () => {
                const good = choose(["How many hours do students sleep?", "How far do students live from school?", "How many pets do families own?"]);
                return { q: `Which of these is a statistical question?`, ans: good, distractors: ["What is 5+5?", "How old is the current President?", "Is 7 a prime number?"], guide: `A statistical question expects a range of different answers from a group.` };
            }},
            { type: "AbsVal", anchor: "A-N.3.2.1", openEnded: false, gen: () => {
                const n = rand(1, 150);
                return { q: `What is the absolute value of -${n}?`, ans: n.toString(), distractors: [(-n).toString(), "0", (n + 1).toString()], guide: `The absolute value of a number is its distance from 0. |-${n}| = ${n}.` };
            }},
            { type: "DecMult", anchor: "A-N.2.1", openEnded: false, gen: () => {
                const a = rand(11, 99); const b = rand(2, 15); const product = a * b; const ans = (product / 10).toFixed(1);
                return { q: `Multiply: ${(a / 10).toFixed(1)} × ${b}`, ans: ans, distractors: [(product / 100).toFixed(2), product.toString(), (product / 10 + 1).toFixed(1)], guide: `${(a / 10).toFixed(1)} × ${b}: ignore the decimal, ${a} × ${b} = ${product}. Place the decimal: ${ans}.` };
            }},
            { type: "Percents", anchor: "A-R.1.1.5", openEnded: false, gen: () => {
                const pct = rand(1, 9) * 10; const whole = rand(2, 50) * 10; const ans = pct * whole / 100;
                return { q: `What is ${pct}% of ${whole}?`, ans: ans.toString(), distractors: [(ans + 10).toString(), (whole - pct).toString(), pct.toString()], guide: `${pct}% of ${whole} = ${pct}/100 × ${whole} = ${ans}.` };
            }},
            { type: "DistProp", anchor: "B-E.1.1.4", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(1, 15); const x = rand(2, 15); const ans = a * x + a * b;
                return { q: `Use the distributive property to expand: ${a}(x + ${b}). Then evaluate for x = ${x}.`, ans: ans.toString(), distractors: [(a + x + b).toString(), (a * x).toString(), (a * b).toString()], guide: `${a}(x + ${b}) = ${a}x + ${a * b}. When x = ${x}: ${a}(${x}) + ${a * b} = ${a * x} + ${a * b} = ${ans}.` };
            }},
            { type: "InEq", anchor: "B-E.3.1.2", openEnded: false, gen: () => {
                const add = rand(2, 20); const rhs = rand(add + 2, 50); const ans = rhs - add;
                return { q: `Solve: x + ${add} > ${rhs}`, ans: `x > ${ans}`, distractors: [`x < ${ans}`, `x > ${rhs}`, `x = ${ans}`], guide: `Subtract ${add} from both sides: x > ${rhs} - ${add}, so x > ${ans}.` };
            }},
            { type: "AreaTri", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const b = rand(3, 30); const h = rand(2, 24); const ans = (b * h) / 2;
                return { q: `Find the area of a triangle with base ${b} and height ${h}.`, ans: ans.toString(), distractors: [(b * h).toString(), (b + h).toString(), (ans + b).toString()], guide: `Area = 1/2 × base × height = 1/2 × ${b} × ${h} = ${ans}.` };
            }},
            { type: "Mean", anchor: "D-S.1.1", openEnded: false, gen: () => {
                const a = rand(5, 80); const b = rand(5, 80); const c = rand(5, 80); const sum = a + b + c; const ans = (sum / 3).toFixed(1);
                return { q: `Find the mean of ${a}, ${b}, and ${c}.`, ans: sum % 3 === 0 ? (sum / 3).toString() : ans, distractors: [(sum).toString(), Math.max(a, b, c).toString(), Math.min(a, b, c).toString()], guide: `Mean = (${a} + ${b} + ${c}) / 3 = ${sum} / 3 = ${sum % 3 === 0 ? sum / 3 : ans}.` };
            }},
            { type: "Mode", anchor: "D-S.1.1", openEnded: false, gen: () => {
                const mode = rand(2, 25); const other1 = mode + rand(1, 8); const other2 = mode - rand(1, 5);
                return { q: `Find the mode of the data set: ${mode}, ${other1}, ${mode}, ${other2}, ${mode}`, ans: mode.toString(), distractors: [other1.toString(), other2.toString(), ((mode + other1 + other2) / 3).toFixed(0)], guide: `The mode is the number that appears most often. ${mode} appears 3 times.` };
            }},
            { type: "CoordRef", anchor: "A-N.3", openEnded: false, gen: () => {
                const x = rand(1, 20); const y = rand(1, 20);
                return { q: `If the point (${x}, ${y}) is reflected over the x-axis, what are the new coordinates?`, ans: `(${x}, -${y})`, distractors: [`(-${x}, ${y})`, `(-${x}, -${y})`, `(${y}, ${x})`], guide: `Reflecting over the x-axis negates the y-coordinate: (${x}, ${y}) becomes (${x}, -${y}).` };
            }},
            { type: "NetID", anchor: "C-G.1", openEnded: false, gen: () => {
                return { q: `A net made of 6 squares can be folded into which 3D shape?`, ans: "Cube", distractors: ["Rectangular prism", "Pyramid", "Cylinder"], guide: `A cube has 6 square faces. A net of 6 squares (arranged correctly) folds into a cube.` };
            }},
            { type: "InDep", anchor: "B-E.2", openEnded: false, gen: () => {
                return { q: `In the equation y = 3x + 2, which is the independent variable?`, ans: "x", distractors: ["y", "3", "2"], guide: `The independent variable is the input (x). The dependent variable (y) changes based on the value of x.` };
            }},

            // ===== 2024 GRADE 6 SET =====

            { type: "FracDiv6", anchor: "A-N.1.1.1", openEnded: false, gen: () => ({
                q: "4/5 ÷ 2/3 = ?", ans: "1 1/5", distractors: ["2/15", "5/6", "4 4/5"], guide: "4/5 × 3/2 = 6/5 = 1 1/5."
            })},
            { type: "GCFFactor", anchor: "A-N.2.2.1", openEnded: false, gen: () => ({
                q: "GCF of a·a·b·b and b·b·c?", ans: "b·b", distractors: ["a·c", "a·b·c", "b"], guide: "Common factors are b and b."
            })},
            { type: "NumberLinePos", anchor: "A-N.3.1.1", openEnded: false, gen: () => ({
                q: "Pos vs Neg account. Relation?", ans: "Opposite sides of 0", distractors: ["Same side", "At 0", "Right of 10"], guide: "0 separates positive and negative."
            })},
            { type: "IntCompare", anchor: "A-N.3.2.1", openEnded: false, gen: () => {
                const neg = -rand(50, 999); const pos = rand(20, 800);
                return { q: `Compare ${neg} and ${pos}.`, ans: `${neg} < ${pos}`, distractors: [`${neg} > ${pos}`, "Equal", `${pos} < 0`], guide: "Negative is less than positive." };
            }},
            { type: "RatioContext", anchor: "A-R.1.1.1", openEnded: false, gen: () => {
                const a = rand(2, 18); const b = rand(2, 14);
                const item1 = choose(["paintings", "cats", "apples", "boys"]);
                const item2 = choose(["photos", "dogs", "oranges", "girls"]);
                return { q: `Ratio ${a}:${b} ${item1} to ${item2} means?`, ans: `${a} ${item1} for ${b} ${item2}`, distractors: [`${b} for ${a}`, `${a - b} more`, `${a + b} total`], guide: "Follow the word order." };
            }},
            { type: "RateCalc", anchor: "A-R.1.1.3", openEnded: false, gen: () => ({
                q: "30 min = $1.60. 210 min?", ans: "$11.20", distractors: ["$10.40", "$12.80", "$14.40"], guide: "$1.60/30 = rate. Rate × 210."
            })},
            { type: "RateDiff", anchor: "A-R.1.1.4", openEnded: false, gen: () => {
                const a = rand(6, 30); const b = rand(2, 12); const hrs = rand(2, 12);
                const ans = (a - b) * hrs;
                return { q: `A: ${a}/hr, B: ${b}/hr. Diff in ${hrs} hrs?`, ans: ans.toString(), distractors: [(a - b).toString(), (a * hrs).toString(), (b * hrs).toString()], guide: `${a - b} diff × ${hrs} hours = ${ans}.` };
            }},
            { type: "OneStepEq", anchor: "B-E.2.1.3", openEnded: false, gen: () => ({
                q: "b + 3.875 = 8.25. b?", ans: "4.375", distractors: ["4.125", "12.125", "5"], guide: "8.25 - 3.875."
            })},
            { type: "VariableLogic", anchor: "B-E.3.1", openEnded: false, gen: () => {
                const fee = rand(20, 200); const perPerson = rand(2, 15); const teachers = rand(2, 10);
                return { q: `In the expression ${fee} + ${perPerson}(${teachers} + x), if ${teachers} is the number of teachers, what does x most likely represent?`, ans: "students", distractors: ["cost", "fee", "days"], guide: `x is added to teachers in the grouping, so it represents students.` };
            }},
            { type: "TrapezoidArea6", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const h = rand(5, 80); const b1 = rand(15, 120); const b2 = rand(40, 250);
                const ans = 0.5 * h * (b1 + b2);
                return { q: `H=${h}, B=${b1},${b2}. Area?`, ans: ans.toString(), distractors: [(h * b1).toString(), (h * (b1 + b2)).toString(), (b1 + b2).toString()], guide: `1/2 × ${h} × (${b1}+${b2}) = ${ans}.` };
            }},
            { type: "FracPrismVol", anchor: "C-G.1.1.2", openEnded: false, gen: () => ({
                q: "1 2/3 × 1 1/2 × 3/5 = ?", ans: "1.5", distractors: ["2.2", "4.4", "1"], guide: "Multiply the three fractions: 5/3 × 3/2 × 3/5 = 45/30 = 1.5."
            })},
            { type: "SAPrism", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const l = rand(4, 30); const w = rand(2, 18); const h = rand(2, 18);
                const sa = 2 * (l * w + l * h + w * h);
                return { q: `SA of ${l}x${w}x${h} prism?`, ans: sa.toString(), distractors: [(l * w * h).toString(), (l * w + l * h + w * h).toString(), (2 * l * w).toString()], guide: `2(LW+LH+WH) = 2(${l * w}+${l * h}+${w * h}) = ${sa}.` };
            }},
            { type: "MedianSearch", anchor: "D-S.1.1.2", openEnded: false, gen: () => {
                const a = rand(20, 180); const b = a + rand(2, 40);
                const ans = (a + b) / 2;
                return { q: `Median of ${a} and ${b}?`, ans: ans.toString(), distractors: [a.toString(), b.toString(), (a + b).toString()], guide: `Avg of middle two: (${a}+${b})/2 = ${ans}.` };
            }},
            { type: "MADCalc", anchor: "D-S.1.1.3", openEnded: false, gen: () => {
                const sum = rand(8, 90); const n = rand(4, 18);
                return { q: `Sum dist ${sum}, count ${n}. MAD?`, ans: `${sum}/${n}`, distractors: [(sum * n).toString(), (sum + n).toString(), (sum - n).toString()], guide: `Sum / Count = ${sum}/${n}.` };
            }},
            { type: "GapPlot", anchor: "D-S.1.1.1", openEnded: false, gen: () => ({
                q: "Freq of 0 in interval means?", ans: "gap", distractors: ["peak", "skew", "mean"], guide: "Zero frequency = gap in data."
            })},
            { type: "StatQuestion6", anchor: "D-S.1.1.1", openEnded: false, gen: () => ({
                q: "Which is statistical?", ans: "Student sleep hours", distractors: ["5+5", "King age", "Date"], guide: "A statistical question expects varied answers."
            })},

            // ===== 2023 GRADE 6 SET =====

            { type: "RatioSimpl", anchor: "A-R.1", openEnded: false, gen: () => ({
                q: "63 oz beans, 18 oz corn. Ratio?", ans: "7:2", distractors: ["2:7", "9:7", "7:9"], guide: "Divide by 9."
            })},
            { type: "AbsVal6", anchor: "A-N.3.2.1", openEnded: false, gen: () => {
                const n = rand(5, 100);
                return { q: `|-${n}| = ?`, ans: n.toString(), distractors: [(-n).toString(), "0", "1"], guide: "Positive distance from 0." };
            }},
            { type: "DecimalMulti6", anchor: "A-N.2.1", openEnded: false, gen: () => ({
                q: "0.5 × 0.2 = ?", ans: "0.1", distractors: ["1.0", "0.01", "0.7"], guide: "Standard multiplication."
            })},
            { type: "PercentOf6", anchor: "A-R.1.1.5", openEnded: false, gen: () => {
                const w = rand(4, 25) * 10;
                return { q: `15% of ${w}?`, ans: (0.15 * w).toFixed(1), distractors: ["15", "8", "20"], guide: `0.15 × ${w} = ${(0.15 * w).toFixed(1)}.` };
            }},
            { type: "NumberOrder6", anchor: "A-N.3.1", openEnded: false, gen: () => ({
                q: "-5 is to the __ of -2?", ans: "left", distractors: ["right", "above", "below"], guide: "Smaller is left on the number line."
            })},
            { type: "Distributive6", anchor: "B-E.1.1.4", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 20);
                return { q: `${a}(x + ${b}) = ?`, ans: `${a}x + ${a * b}`, distractors: [`${a}x + ${b}`, `x + ${a * b}`, `${a + b}x`], guide: `Multiply both terms: ${a}x + ${a * b}.` };
            }},
            { type: "InEquality6", anchor: "B-E.3.1.2", openEnded: false, gen: () => {
                const n = rand(5, 40);
                return { q: `x + 5 > ${n}. Solve.`, ans: `x > ${n - 5}`, distractors: [`x < ${n - 5}`, `x = ${n - 5}`, `x > ${n}`], guide: `Subtract 5: x > ${n - 5}.` };
            }},
            { type: "TriangleArea6", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const b = rand(4, 30); const h = rand(2, 20);
                return { q: `Base ${b}, height ${h} area?`, ans: (0.5 * b * h).toString(), distractors: [(b * h).toString(), (b + h).toString(), "10"], guide: `1/2 × ${b} × ${h} = ${0.5 * b * h}.` };
            }},
            { type: "MeanSet6", anchor: "D-S.1.1", openEnded: false, gen: () => {
                const a = rand(2, 30); const b = rand(2, 30); const c = rand(2, 30);
                const sum = a + b + c;
                return { q: `Mean of ${a}, ${b}, ${c}?`, ans: (sum / 3).toFixed(1), distractors: [sum.toString(), a.toString(), c.toString()], guide: `Sum/Count = ${sum}/3.` };
            }},
            { type: "ModeSet6", anchor: "D-S.1.1", openEnded: false, gen: () => ({
                q: "Mode of 1, 2, 2, 3?", ans: "2", distractors: ["1", "3", "8"], guide: "Most frequent value."
            })},
            { type: "ReflectX6", anchor: "A-N.3", openEnded: false, gen: () => {
                const x = rand(1, 15); const y = rand(1, 15);
                return { q: `Reflect (${x}, ${y}) over x-axis?`, ans: `(${x}, -${y})`, distractors: [`(-${x}, ${y})`, `(-${x}, -${y})`, `(${y}, ${x})`], guide: "Change Y sign." };
            }},
            { type: "UnitRateWord6", anchor: "A-R.1.1", openEnded: false, gen: () => {
                const total = rand(2, 20) * 5; const items = rand(2, 20);
                const rate = total / items;
                return { q: `$${total} for ${items} books. Per book?`, ans: rate.toString(), distractors: [items.toString(), (total * items).toString(), (total - items).toString()], guide: `${total}/${items} = ${rate}.` };
            }},
            { type: "NetCube6", anchor: "C-G.1", openEnded: false, gen: () => ({
                q: "Net with 6 squares?", ans: "Cube", distractors: ["Pyramid", "Prism", "Cylinder"], guide: "6 faces = cube."
            })},
            { type: "RangeCalc6", anchor: "D-S.1", openEnded: false, gen: () => {
                const max = rand(10, 50); const min = rand(1, 10);
                return { q: `Max ${max}, Min ${min}. Range?`, ans: (max - min).toString(), distractors: [(max + min).toString(), "5", "20"], guide: `Max - Min = ${max - min}.` };
            }},
            { type: "Independent6", anchor: "B-E.2", openEnded: false, gen: () => ({
                q: "y = 5x. Which is independent?", ans: "x", distractors: ["y", "5", "None"], guide: "x is the input variable."
            })},
            { type: "Squared6", anchor: "B-E.1", openEnded: false, gen: () => {
                const n = rand(2, 20);
                return { q: `${n} squared?`, ans: (n * n).toString(), distractors: [(n * 2).toString(), n.toString(), (n * n + n).toString()], guide: `${n} × ${n} = ${n * n}.` };
            }},
            { type: "IntegerAddition", anchor: "Add two integers (positive + negative).", openEnded: false, gen: () => {
                const a = rand(10, 99); const b = -rand(10, 99);
                const ans = a + b;
                const wrong1 = a - b;
                const wrong2 = -(a + Math.abs(b));
                const wrong3 = ans + 2;
                return { q: `Calculate: ${a} + (${b})`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${a} + (${b}) means ${a} − ${Math.abs(b)} = ${ans}.` };
            }},
            { type: "IntegerSubtraction", anchor: "Subtract integers.", openEnded: false, gen: () => {
                const a = rand(-50, 50); const b = rand(-50, 50);
                const ans = a - b;
                const wrong1 = a + b;
                const wrong2 = b - a;
                const wrong3 = ans + 1;
                return { q: `Calculate: ${a} − ${b >= 0 ? b : '(' + b + ')'}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${a} − ${b >= 0 ? b : '(' + b + ')'} = ${a} ${b < 0 ? '+ ' + Math.abs(b) : '− ' + b} = ${ans}.` };
            }},
            { type: "IntegerMultiplication", anchor: "Multiply two integers using sign rules.", openEnded: false, gen: () => {
                const aSign = choose([-1, 1]); const bSign = choose([-1, 1]);
                const aAbs = rand(2, 12); const bAbs = rand(2, 12);
                const a = aSign * aAbs; const b = bSign * bAbs;
                const ans = a * b;
                const wrong1 = -ans;
                const wrong2 = a + b;
                const wrong3 = Math.abs(ans) + 1;
                const signRule = (aSign === bSign) ? "Same signs → positive" : "Different signs → negative";
                return { q: `Calculate: ${a} × ${b >= 0 ? b : '(' + b + ')'}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${aAbs} × ${bAbs} = ${aAbs * bAbs}. ${signRule}. Answer: ${ans}.` };
            }},
            { type: "IntegerDivision", anchor: "Divide integers using sign rules.", openEnded: false, gen: () => {
                const quotient = rand(2, 12);
                const bAbs = rand(2, 12);
                const aSign = choose([-1, 1]); const bSign = choose([-1, 1]);
                const a = aSign * quotient * bAbs; const b = bSign * bAbs;
                const ans = a / b;
                const wrong1 = -ans;
                const wrong2 = a - b;
                const wrong3 = Math.abs(ans) + 1;
                const signRule = (aSign === bSign) ? "Same signs → positive" : "Different signs → negative";
                return { q: `Calculate: ${a} ÷ ${b >= 0 ? b : '(' + b + ')'}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(ans)}. ${signRule}. Answer: ${ans}.` };
            }},
            { type: "AbsoluteValueCalc", anchor: "Evaluate absolute value expressions.", openEnded: false, gen: () => {
                const a = rand(-50, -1); const b = rand(1, 30);
                const expr = a + b; const ans = Math.abs(expr);
                const wrong1 = expr;
                const wrong2 = -ans;
                const wrong3 = Math.abs(a) + b;
                return { q: `Evaluate: |${a} + ${b}|`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `First compute inside: ${a} + ${b} = ${expr}. Then take absolute value: |${expr}| = ${ans}.` };
            }},
            { type: "OrderIntegers", anchor: "Order integers from least to greatest.", openEnded: false, gen: () => {
                const nums = [];
                while (nums.length < 5) { const n = rand(-50, 50); if (!nums.includes(n)) nums.push(n); }
                const sorted = [...nums].sort((a, b) => a - b);
                const ans = sorted.join(", ");
                const revSorted = [...sorted].reverse().join(", ");
                const almostSorted = [...sorted]; const t = almostSorted[1]; almostSorted[1] = almostSorted[2]; almostSorted[2] = t;
                const wrong2 = almostSorted.join(", ");
                const shuffled = shuffle([...nums]);
                return { q: `Order from least to greatest: ${nums.join(", ")}`, ans: ans, distractors: [revSorted, wrong2, shuffled.join(", ")], guide: `Negative numbers are less than positive. Ordering: ${ans}.` };
            }},
            { type: "RatioSimplify", anchor: "Simplify a ratio using GCF.", openEnded: false, gen: () => {
                const sa = rand(1, 10); const sb = rand(1, 10);
                const mult = rand(2, 8);
                const a = sa * mult; const b = sb * mult;
                const g = gcd(a, b);
                const ans = `${a / g}:${b / g}`;
                const wrong1 = `${a}:${b}`;
                const wrong2 = `${b / g}:${a / g}`;
                const wrong3 = `${a / g + 1}:${b / g}`;
                return { q: `Simplify the ratio ${a}:${b}.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `GCF of ${a} and ${b} is ${g}. Divide both: ${a} ÷ ${g} = ${a / g}, ${b} ÷ ${g} = ${b / g}. Simplified: ${ans}.` };
            }},
            { type: "UnitRateCalc", anchor: "Find a unit rate.", openEnded: false, gen: () => {
                const rate = rand(2, 15); const qty = rand(3, 12);
                const total = rate * qty;
                const units = choose([["miles", "hours"], ["dollars", "pounds"], ["words", "minutes"], ["pages", "hours"]]);
                const ans = rate;
                const wrong1 = total;
                const wrong2 = qty;
                const wrong3 = rate + 1;
                return { q: `${total} ${units[0]} in ${qty} ${units[1]}. What is the unit rate?`, ans: `${ans} ${units[0]} per ${units[1].slice(0, -1)}`, distractors: [`${wrong1} ${units[0]} per ${units[1].slice(0, -1)}`, `${wrong2} ${units[0]} per ${units[1].slice(0, -1)}`, `${wrong3} ${units[0]} per ${units[1].slice(0, -1)}`], guide: `Divide total by quantity: ${total} ÷ ${qty} = ${ans} ${units[0]} per ${units[1].slice(0, -1)}.` };
            }},
            { type: "ProportionSolve", anchor: "Solve a proportion using cross-multiplication.", openEnded: false, gen: () => {
                const a = rand(1, 10); const b = rand(2, 12); const c = rand(2, 10);
                const x = b * c / a;
                const mult = rand(2, 5);
                const a2 = a * mult; const b2 = b * mult; const c2 = c;
                const ans2 = b2 * c2 / a2;
                const ans = ans2;
                const wrong1 = a2 * c2 / b2;
                const wrong2 = ans + 1;
                const wrong3 = a2 + c2;
                return { q: `Solve: ${a2}/${b2} = ${c2}/x`, ans: ans.toString(), distractors: [wrong1.toFixed(1), wrong2.toString(), wrong3.toString()], guide: `Cross multiply: ${a2} × x = ${b2} × ${c2} = ${b2 * c2}. Divide: x = ${b2 * c2} ÷ ${a2} = ${ans}.` };
            }},
            { type: "PercentToDecimal", anchor: "Convert a percent to a decimal.", openEnded: false, gen: () => {
                const pct = rand(1, 150);
                const ans = (pct / 100).toString();
                const wrong1 = (pct / 10).toString();
                const wrong2 = (pct / 1000).toString();
                const wrong3 = pct.toString();
                return { q: `Convert ${pct}% to a decimal.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Divide by 100: ${pct} ÷ 100 = ${ans}. Move decimal point 2 places left.` };
            }},
            { type: "DecimalToPercent", anchor: "Convert a decimal to a percent.", openEnded: false, gen: () => {
                const dec = rand(1, 99);
                const decStr = (dec / 100).toString();
                const ans = `${dec}%`;
                const wrong1 = `${dec / 10}%`;
                const wrong2 = `${dec * 10}%`;
                const wrong3 = `${dec + 1}%`;
                return { q: `Convert ${decStr} to a percent.`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Multiply by 100: ${decStr} × 100 = ${dec}%. Move decimal point 2 places right.` };
            }},
            { type: "PercentOfNumber6", anchor: "Find a percent of a number.", openEnded: false, gen: () => {
                const pct = choose([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
                const whole = rand(2, 40) * 10;
                const ans = pct / 100 * whole;
                const wrong1 = pct * whole / 10;
                const wrong2 = ans + 5;
                const wrong3 = whole - ans;
                return { q: `What is ${pct}% of ${whole}?`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `Convert: ${pct}% = ${pct / 100}. Multiply: ${pct / 100} × ${whole} = ${ans}.` };
            }},
            { type: "PercentChange", anchor: "Calculate percent increase or decrease.", openEnded: false, gen: () => {
                const original = rand(2, 20) * 10;
                const isIncrease = rand(0, 1) === 1;
                const changePct = choose([10, 20, 25, 30, 40, 50]);
                const changeAmt = original * changePct / 100;
                const newVal = isIncrease ? original + changeAmt : original - changeAmt;
                const direction = isIncrease ? "increase" : "decrease";
                const ans = `${changePct}%`;
                const wrong1 = `${changePct / 2}%`;
                const wrong2 = `${changePct + 10}%`;
                const wrong3 = `${changeAmt}%`;
                return { q: `A value went from ${original} to ${newVal}. What is the percent ${direction}?`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Change = ${isIncrease ? newVal + ' − ' + original : original + ' − ' + newVal} = ${changeAmt}. Percent = ${changeAmt}/${original} × 100 = ${changePct}%.` };
            }},
            { type: "OneStepEquationAdd", anchor: "Solve x + a = b.", openEnded: false, gen: () => {
                const x = rand(-20, 20); const a = rand(1, 30);
                const b = x + a;
                const wrong1 = b + a;
                const wrong2 = x + 1;
                const wrong3 = -x;
                return { q: `Solve: x + ${a} = ${b}`, ans: `x = ${x}`, distractors: [`x = ${wrong1}`, `x = ${wrong2}`, `x = ${wrong3}`], guide: `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}.` };
            }},
            { type: "OneStepEquationMult", anchor: "Solve ax = b.", openEnded: false, gen: () => {
                const x = rand(-12, 12); const a = rand(2, 10);
                const b = a * x;
                const wrong1 = b - a;
                const wrong2 = b + a;
                const wrong3 = x + 1;
                return { q: `Solve: ${a}x = ${b}`, ans: `x = ${x}`, distractors: [`x = ${wrong1}`, `x = ${wrong2}`, `x = ${wrong3}`], guide: `Divide both sides by ${a}: x = ${b} ÷ ${a} = ${x}.` };
            }},
            { type: "OneStepInequality", anchor: "Solve a one-step inequality.", openEnded: false, gen: () => {
                const a = rand(1, 20); const b = rand(5, 40);
                const x = b - a;
                const op = choose([">", "<", "≥", "≤"]);
                const ans = `x ${op} ${x}`;
                const wrong1 = `x ${op} ${x + a}`;
                const wrong2 = `x ${op === ">" ? "<" : (op === "<" ? ">" : (op === "≥" ? "≤" : "≥"))} ${x}`;
                const wrong3 = `x ${op} ${x + 1}`;
                return { q: `Solve: x + ${a} ${op} ${b}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Subtract ${a} from both sides: x ${op} ${b} − ${a}, so ${ans}.` };
            }},
            { type: "DistributiveProperty", anchor: "Expand using the distributive property.", openEnded: false, gen: () => {
                const a = rand(2, 9); const b = rand(1, 12); const c = rand(1, 12);
                const ab = a * b; const ac = a * c;
                const ans = `${ab} + ${ac}`;
                const wrong1 = `${a + b} + ${a + c}`;
                const wrong2 = `${ab} + ${c}`;
                const wrong3 = `${a} + ${b * c}`;
                return { q: `Expand: ${a}(${b} + ${c})`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Distribute ${a}: ${a} × ${b} = ${ab} and ${a} × ${c} = ${ac}. Result: ${ans}.` };
            }},
            { type: "CombineLikeTerms", anchor: "Simplify by combining like terms.", openEnded: false, gen: () => {
                const a = rand(1, 9); const b = rand(1, 9); const c = rand(1, 9); const d = rand(1, 9);
                const xCoeff = a + c; const constant = b + d;
                const ans = `${xCoeff}x + ${constant}`;
                const wrong1 = `${a + b}x + ${c + d}`;
                const wrong2 = `${a * c}x + ${b * d}`;
                const wrong3 = `${xCoeff}x + ${constant + 1}`;
                return { q: `Simplify: ${a}x + ${b} + ${c}x + ${d}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Combine x-terms: ${a}x + ${c}x = ${xCoeff}x. Combine constants: ${b} + ${d} = ${constant}. Answer: ${ans}.` };
            }},
            { type: "AreaTriangleCalc", anchor: "Find the area of a triangle.", openEnded: false, gen: () => {
                const base = rand(4, 20); const height = rand(3, 16);
                const ans = base * height / 2;
                const wrong1 = base * height;
                const wrong2 = (base + height) / 2;
                const wrong3 = ans + base;
                return { q: `Find the area of a triangle with base ${base} and height ${height}.`, ans: `${ans} square units`, distractors: [`${wrong1} square units`, `${wrong2} square units`, `${wrong3} square units`], guide: `Area = (1/2) × base × height = (1/2) × ${base} × ${height} = ${ans} square units.` };
            }},
            { type: "AreaParallelogramCalc", anchor: "Find the area of a parallelogram.", openEnded: false, gen: () => {
                const base = rand(3, 18); const height = rand(3, 14);
                const ans = base * height;
                const wrong1 = 2 * (base + height);
                const wrong2 = base * height / 2;
                const wrong3 = ans + base;
                return { q: `Find the area of a parallelogram with base ${base} and height ${height}.`, ans: `${ans} square units`, distractors: [`${wrong1} square units`, `${wrong2} square units`, `${wrong3} square units`], guide: `Area = base × height = ${base} × ${height} = ${ans} square units.` };
            }},
            { type: "SurfaceAreaBox", anchor: "Find the surface area of a rectangular prism.", openEnded: false, gen: () => {
                const l = rand(2, 10); const w = rand(2, 8); const h = rand(2, 7);
                const ans = 2 * (l * w + l * h + w * h);
                const wrong1 = l * w * h;
                const wrong2 = l * w + l * h + w * h;
                const wrong3 = 2 * l * w + 2 * w * h;
                return { q: `Find the surface area of a box with length ${l}, width ${w}, height ${h}.`, ans: `${ans} square units`, distractors: [`${wrong1} square units`, `${wrong2} square units`, `${wrong3} square units`], guide: `SA = 2(lw + lh + wh) = 2(${l * w} + ${l * h} + ${w * h}) = 2(${l * w + l * h + w * h}) = ${ans} square units.` };
            }},
            { type: "MeanCalc", anchor: "Find the mean of a data set.", openEnded: false, gen: () => {
                const count = rand(4, 6);
                const nums = []; let sum = 0;
                for (let i = 0; i < count - 1; i++) { const n = rand(10, 50); nums.push(n); sum += n; }
                const target = rand(10, 50); const lastNum = count * target - sum;
                if (lastNum < 1 || lastNum > 100) { nums.push(rand(10, 50)); sum += nums[nums.length - 1]; } else { nums.push(lastNum); sum += lastNum; }
                const mean = sum / nums.length;
                const ans = Number.isInteger(mean) ? mean.toString() : mean.toFixed(1);
                const wrong1 = (sum + nums.length).toString();
                const sorted = [...nums].sort((a, b) => a - b);
                const wrong2 = sorted[Math.floor(sorted.length / 2)].toString();
                const wrong3 = (mean + 2).toFixed(1);
                return { q: `Find the mean: ${nums.join(", ")}`, ans: ans, distractors: [wrong1, wrong2, wrong3], guide: `Sum = ${sum}. Count = ${nums.length}. Mean = ${sum} ÷ ${nums.length} = ${ans}.` };
            }},
            { type: "MedianCalc", anchor: "Find the median of a data set.", openEnded: false, gen: () => {
                const count = choose([5, 7]);
                const nums = [];
                for (let i = 0; i < count; i++) nums.push(rand(5, 50));
                const sorted = [...nums].sort((a, b) => a - b);
                const median = sorted[Math.floor(count / 2)];
                const sum = nums.reduce((a, b) => a + b, 0);
                const wrong1 = (sum / count).toFixed(1);
                const wrong2 = sorted[0].toString();
                const wrong3 = sorted[count - 1].toString();
                return { q: `Find the median: ${nums.join(", ")}`, ans: median.toString(), distractors: [wrong1, wrong2, wrong3], guide: `Sort the data: ${sorted.join(", ")}. The middle value is ${median}.` };
            }},
            { type: "ModeCalc", anchor: "Find the mode of a data set.", openEnded: false, gen: () => {
                const base = rand(5, 30); const mode = rand(5, 40);
                const nums = [mode, mode, mode];
                for (let i = 0; i < 4; i++) { let n = rand(5, 40); if (n === mode) n = mode + rand(1, 5); nums.push(n); }
                const shuffled = shuffle([...nums]);
                const sum = shuffled.reduce((a, b) => a + b, 0);
                const wrong1 = (sum / shuffled.length).toFixed(0);
                const sorted = [...shuffled].sort((a, b) => a - b);
                const wrong2 = sorted[Math.floor(sorted.length / 2)].toString();
                const wrong3 = (mode + 1).toString();
                return { q: `Find the mode: ${shuffled.join(", ")}`, ans: mode.toString(), distractors: [wrong1, wrong2, wrong3], guide: `Count each value. ${mode} appears most often (3 times). The mode is ${mode}.` };
            }},
            { type: "RangeCalc", anchor: "Find the range of a data set.", openEnded: false, gen: () => {
                const count = rand(5, 8); const nums = [];
                for (let i = 0; i < count; i++) nums.push(rand(2, 80));
                const max = Math.max(...nums); const min = Math.min(...nums);
                const ans = max - min;
                const wrong1 = max + min;
                const wrong2 = Math.floor((max + min) / 2);
                const wrong3 = ans + 1;
                return { q: `Find the range: ${nums.join(", ")}`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `Max = ${max}, Min = ${min}. Range = ${max} − ${min} = ${ans}.` };
            }},
            { type: "ExpressionEvaluate", anchor: "Substitute a value into an expression and evaluate.", openEnded: false, gen: () => {
                const a = rand(2, 8); const b = rand(1, 10); const x = rand(1, 9);
                const ans = a * x + b;
                const wrong1 = a + x + b;
                const wrong2 = a * x * b;
                const wrong3 = a * x - b;
                return { q: `Evaluate ${a}x + ${b} when x = ${x}.`, ans: ans.toString(), distractors: [wrong1.toString(), wrong2.toString(), wrong3.toString()], guide: `Substitute x = ${x}: ${a}(${x}) + ${b} = ${a * x} + ${b} = ${ans}.` };
            }}
        ],
        7: [
            { type: "Int Add", anchor: "Add/Sub rational numbers.", openEnded: false, gen: () => {
                const a = -rand(10, 90); const b = rand(5, 80); const c = -rand(1, 25); const ans = a + b + c;
                return { q: `Simplify: ${a} + ${b} + (${c})`, ans: ans.toString(), distractors: [(a-b+c).toString(), (ans+2).toString(), (a+b-c).toString()], guide: `${a} + ${b} = ${a+b}. Then ${a+b} + (${c}) = ${ans}.` };
            }},
            { type: "Avg Change", anchor: "Real life rational ops.", openEnded: false, gen: () => {
                const total = -(rand(1, 25) / 100); const days = rand(2, 10);
                return { q: `The total change in price over ${days} days is ${total}. Is the average daily change positive or negative?`, ans: "Negative", distractors: ["Positive", "Zero", "Not enough info"], guide: `A negative total (${total}) divided by a positive number of days (${days}) results in a negative average.` };
            }},
            { type: "Rat Mult", anchor: "Mult/Div rational numbers.", openEnded: false, gen: () => {
                const lap = rand(15, 80) / 100; const laps = rand(15, 80) / 10; const ans = (lap * laps).toFixed(2);
                return { q: `A track is ${lap}km. If a runner goes around ${laps} times, total distance?`, ans: ans, distractors: [(lap+laps).toFixed(2), (lap*10).toFixed(2), (laps).toString()], guide: `${lap} × ${laps} = ${ans} km.` };
            }},
            { type: "Prop Logic", anchor: "Recognize proportional relations.", openEnded: false, gen: () => {
                const v1 = rand(5, 60); const v2 = v1 + rand(5, 50); const rate = (v2 / v1).toFixed(1);
                return { q: `If ${v1} songs cost d dollars, how do you find the cost of ${v2} songs?`, ans: `multiply d by ${rate}`, distractors: [`add ${v2-v1} to d`, `subtract ${v2-v1} from d`, `divide d by ${rate}`], guide: `${v2} is ${rate} times ${v1}, so the cost must be multiplied by ${rate}.` };
            }},
            { type: "Unit Rate", anchor: "Constant of proportionality.", openEnded: false, gen: () => {
                const rate = rand(3, 20); const hours = rand(10, 50) / 10; const pages = rate * hours;
                return { q: `You type ${pages} pages in ${hours} hours. What is your unit rate in pages per hour?`, ans: rate.toString(), distractors: [(rate-1).toString(), (rate+2).toString(), pages.toString()], guide: `Rate = Pages / Hours = ${pages} / ${hours} = ${rate}.` };
            }},
            { type: "Ratio Eq", anchor: "Represent relations as equations.", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 10); const cups = rand(10, 80) / 10;
                return { q: `The ratio of chips to walnuts is ${a}:${b}. If you use ${cups} cups of chips, which equation finds the walnuts (x)?`, ans: `${cups}/x = ${a}/${b}`, distractors: [`x/${cups} = ${a}/${b}`, `${cups}/${b} = ${a}/x`, `${a}/${cups} = x/${b}`], guide: `Set up the proportion: (Chips/Walnuts) = (Chips/Walnuts). ${cups}/x = ${a}/${b}.` };
            }},
            { type: "Rate Graph", anchor: "Interpret points on graphs.", openEnded: false, gen: () => {
                return { q: `On a proportional graph, where do you look to find the unit rate?`, ans: "the y-value when x=1", distractors: ["the origin", "the y-axis intercept", "the x-value when y=1"], guide: `The point (1, r) always gives the unit rate r.` };
            }},
            { type: "Scaling", anchor: "Solve ratio/percent problems.", openEnded: false, gen: () => {
                const b = rand(200, 1500) / 100; const inc = rand(200, 1800) / 100; const ans = (b + inc).toFixed(2);
                return { q: `An object weighing ${b}kg increases in mass by ${inc}kg. What is the new mass?`, ans: `${ans}`, distractors: [(inc-b).toFixed(2), inc.toString(), b.toString()], guide: `New Mass = Original + Increase = ${b} + ${inc} = ${ans}.` };
            }},
            { type: "Simplify", anchor: "Expand linear expressions.", openEnded: false, gen: () => {
                const pVal = rand(2, 12); const constVal = rand(10, 150);
                const ansP = pVal * 4; const ansC = constVal * 2;
                return { q: `Simplify: 2(${pVal}p + ${constVal} + ${pVal}p)`, ans: `${ansP}p + ${ansC}`, distractors: [`${pVal*2}p + ${constVal}`, `${ansP}p + ${constVal}`, `${ansP+ansC}p`], guide: `Combine like terms: 2(${pVal*2}p + ${constVal}). Distribute: ${ansP}p + ${ansC}.` };
            }},
            { type: "Discount", anchor: "Percent discount logic.", openEnded: false, gen: () => {
                const price = rand(10, 120) + 0.50; const pct = rand(1, 6) * 10;
                return { q: `To find ${pct}% of $${price.toFixed(2)}, what is a correct mental math strategy?`, ans: `Find 10% and multiply by ${pct/10}`, distractors: [`Divide by ${pct}`, `Subtract $1`, `Add ${pct}%`], guide: `10% of $${price.toFixed(2)} is $${(price/10).toFixed(2)}. Multiply by ${pct/10} to get ${pct}%.` };
            }},
            { type: "Student Ratio", anchor: "Proportional word problems.", openEnded: false, gen: () => {
                const b = rand(2, 10); const s = rand(3, 15); const sets = rand(2, 15); const totalB = b * sets; const ans = s * sets;
                return { q: `If you need ${b} boxes for every ${s} students, how many students are there if you have ${totalB} boxes?`, ans: ans.toString(), distractors: [(totalB-b).toString(), (totalB+s).toString(), (ans+5).toString()], guide: `${totalB} / ${b} = ${sets} groups. ${sets} × ${s} = ${ans} students.` };
            }},
            { type: "Scale Map", anchor: "Scale drawing problems.", openEnded: false, gen: () => {
                const scale = rand(3, 50); const dist = rand(10, 150) / 10; const ans = scale * dist;
                return { q: `On a map, 1 inch = ${scale} miles. If two cities are ${dist} inches apart, actual distance?`, ans: ans.toString(), distractors: [dist.toString(), (dist+scale).toString(), (ans*10).toString()], guide: `Multiply inches by the scale: ${dist} × ${scale} = ${ans} miles.` };
            }},
            { type: "Circle", anchor: "Circle area/circumference.", openEnded: false, gen: () => {
                const d = rand(2, 30) * 2; const r = d/2; const ans = r*r;
                return { q: `A circle has a diameter of ${d}. What is its area in terms of π?`, ans: `${ans}π`, distractors: [`${d}π`, `${d*2}π`, `${d*d}π`], guide: `Radius is ${r}. Area = πr² = π(${r}²) = ${ans}π.` };
            }},
            { type: "Angles", anchor: "Facts about angles.", openEnded: false, gen: () => {
                const a = rand(10, 80); const ans = 90 - a;
                return { q: `Two angles are complementary. If one is ${a}°, what is the other?`, ans: `${ans}°`, distractors: [`${a}°`, `${180-a}°`, `180°`], guide: `Complementary angles sum to 90°. 90 - ${a} = ${ans}.` };
            }},
            { type: "Bias", anchor: "Gain info by sampling.", openEnded: false, gen: () => {
                const group = choose(["swim team", "chess club", "band members", "basketball team"]);
                return { q: `A student surveys only the ${group} to decide the new school mascot. This sample is:`, ans: "Biased", distractors: ["Random", "Systematic", "Representative"], guide: `Only asking one specific group does not represent the whole school population.` };
            }},
            { type: "Prob", anchor: "Simple probability 0 to 1.", openEnded: false, gen: () => {
                const red = rand(1, 15); const blue = rand(3, 25); const total = red + blue; const ans = (red / total).toFixed(1);
                return { q: `A bag has ${red} red and ${blue} blue marbles. Probability of picking red?`, ans: ans, distractors: [(blue/total).toFixed(1), red.toString(), blue.toString()], guide: `Probability = Favorable (${red}) / Total (${total}) = ${ans}.` };
            }},
            { type: "RatExp", anchor: "A-N.1.1", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 12); const c = rand(2, 10); const d = rand(2, 10);
                const rn = a * d; const rd = b * c; const g = gcd(rn, rd); const sn = rn / g; const sd = rd / g;
                return { q: `Multiply: ${a}/${b} × ${d}/${c}`, ans: sd === 1 ? sn.toString() : `${sn}/${sd}`, distractors: [`${a * c}/${b * d}`, `${a + d}/${b + c}`, `${b}/${a}`], guide: `Multiply across: (${a} × ${d}) / (${b} × ${c}) = ${rn}/${rd}${g > 1 ? ` = ${sn}/${sd}` : ''}.` };
            }},
            { type: "NumLineModel", anchor: "A-N.1.1", openEnded: false, gen: () => {
                const a = rand(2, 25); const b = rand(1, a - 1);
                return { q: `On a number line, to model ${a} - ${b}, you start at ${a} and move how many units in which direction?`, ans: `${b} units left`, distractors: [`${b} units right`, `${a} units left`, `${a} units right`], guide: `Subtraction means moving left on the number line. ${a} - ${b} means start at ${a} and move ${b} units left.` };
            }},
            { type: "Eq2Step", anchor: "B-E.2.2.1", openEnded: false, gen: () => {
                const x = rand(2, 20); const a = rand(2, 12); const b = rand(1, 20); const c = a * x + b;
                return { q: `Solve: ${a}x + ${b} = ${c}`, ans: `x = ${x}`, distractors: [`x = ${x + 1}`, `x = ${c}`, `x = ${x - 1}`], guide: `Subtract ${b}: ${a}x = ${c - b}. Divide by ${a}: x = ${(c - b)} ÷ ${a} = ${x}.` };
            }},
            { type: "UnitRateFrac", anchor: "A-R.1.1.1", openEnded: false, gen: () => {
                const n = rand(2, 10); const d = rand(2, 8); const hours = rand(2, 8);
                const totalN = n * hours; const ans = `${n}/${d}`;
                return { q: `A painter uses ${totalN}/${d} gallons of paint in ${hours} hours. What is the unit rate in gallons per hour?`, ans: ans, distractors: [`${totalN}/${d * hours}`, `${d}/${n}`, `${hours}/${d}`], guide: `Divide total by hours: (${totalN}/${d}) ÷ ${hours} = ${totalN}/(${d} × ${hours}) = ${n}/${d} gallons per hour.` };
            }},
            { type: "TaxWord", anchor: "A-R.1.1.6", openEnded: false, gen: () => {
                const price = rand(8, 150); const taxPct = rand(3, 12); const tax = (price * taxPct / 100).toFixed(2); const total = (price + parseFloat(tax)).toFixed(2);
                return { q: `An item costs $${price}. Tax is ${taxPct}%. What is the total cost?`, ans: `$${total}`, distractors: [`$${price}`, `$${tax}`, `$${(price + taxPct).toFixed(2)}`], guide: `Tax = ${taxPct}% of $${price} = $${tax}. Total = $${price} + $${tax} = $${total}.` };
            }},
            { type: "InEqFlip", anchor: "B-E.2.2.2", openEnded: false, gen: () => {
                const a = -rand(2, 12); const x = rand(2, 15); const b = a * x;
                return { q: `Solve: ${a}x < ${b}`, ans: `x > ${x}`, distractors: [`x < ${x}`, `x > ${-x}`, `x = ${x}`], guide: `Divide both sides by ${a}. Since ${a} is negative, flip the inequality: x > ${b} ÷ ${a} = ${x}.` };
            }},
            { type: "SampleSize", anchor: "D-S.1.1", openEnded: false, gen: () => {
                return { q: `A school has 800 students. Which sample would best represent the entire school?`, ans: "100 students chosen randomly from all grades", distractors: ["10 students from one class", "All students in the band", "5 teachers"], guide: `A random sample from all grades is more representative because it avoids bias toward any one group.` };
            }},
            { type: "AngleVert", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                return { q: `When two lines intersect, the vertical (opposite) angles are always:`, ans: "Equal", distractors: ["Supplementary", "Complementary", "Right angles"], guide: `Vertical angles are the angles opposite each other when two lines cross. They are always equal in measure.` };
            }},
            { type: "PercentError", anchor: "A-R.1.1", openEnded: false, gen: () => {
                const actual = rand(10, 120); const estimated = actual + rand(1, 20); const error = estimated - actual;
                const pctError = ((error / actual) * 100).toFixed(1);
                return { q: `The actual value is ${actual} and the estimated value is ${estimated}. What is the percent error?`, ans: `${pctError}%`, distractors: [`${error}%`, `${(error / estimated * 100).toFixed(1)}%`, `${actual}%`], guide: `Percent error = |${estimated} - ${actual}| / ${actual} × 100 = ${error}/${actual} × 100 = ${pctError}%.` };
            }},
            { type: "CrossSection", anchor: "C-G.1.1.3", openEnded: false, gen: () => {
                return { q: `If you slice a cylinder horizontally (parallel to the base), the cross-section shape is a:`, ans: "Circle", distractors: ["Rectangle", "Triangle", "Oval"], guide: `A horizontal slice through a cylinder is parallel to its circular base, producing a circle.` };
            }},
            { type: "Simulate", anchor: "D-P.1.1.3", openEnded: false, gen: () => {
                return { q: `To simulate a fair coin flip, which tool would give equally likely outcomes?`, ans: "A coin or random number generator with 2 outcomes", distractors: ["A 6-sided die", "A spinner with 3 sections", "Drawing from 5 cards"], guide: `A fair coin has exactly 2 equally likely outcomes (heads/tails), which matches a 50/50 probability model.` };
            }},

            // ===== 2024 GRADE 7 SET =====

            { type: "IntegerSum", anchor: "A-N.1.1.1", openEnded: false, gen: () => {
                const a = -rand(10, 80); const b = rand(5, 70); const c = -rand(1, 20); const ans = a + b + c;
                return { q: `Simplify: ${a} + ${b} + (${c})`, ans: ans.toString(), distractors: [(a - b + c).toString(), (ans + 5).toString(), (Math.abs(ans)).toString()], guide: `${a} + ${b} = ${a + b}. Then ${a + b} + (${c}) = ${ans}.` };
            }},
            { type: "AvgDailyChange", anchor: "A-N.1.1.3", openEnded: false, gen: () => {
                const total = -(rand(2, 25) / 100).toFixed(2);
                return { q: `The total price change over 4 days was ${total}. Is the average daily change positive or negative?`, ans: "Negative", distractors: ["Positive", "Zero", "Undefined"], guide: "A negative total divided by a positive number of days is negative." };
            }},
            { type: "LapsToKM", anchor: "A-N.1.2.1", openEnded: false, gen: () => {
                const track = rand(20, 80) / 100; const laps = rand(2, 12) + 0.5; const ans = (track * laps).toFixed(2);
                return { q: `A track is ${track}km. Jamie runs ${laps} laps. Total km?`, ans: ans, distractors: [(track + laps).toFixed(2), (track * 10).toFixed(2), laps.toString()], guide: `${track} × ${laps} = ${ans} km.` };
            }},
            { type: "SongScaling", anchor: "A-R.1.1.1", openEnded: false, gen: () => {
                const n1 = rand(5, 50); const factor = [1.5, 2, 2.5, 3, 4, 5][rand(0, 5)]; const n2 = n1 * factor;
                return { q: `If ${n1} songs cost d dollars, how do you find the cost of ${n2} songs?`, ans: `multiply d by ${factor}`, distractors: [`add ${n2 - n1} to d`, `divide d by ${factor}`, "multiply d by 2"], guide: `${n2} is ${factor} times ${n1}, so multiply cost by ${factor}.` };
            }},
            { type: "UnitRatePages", anchor: "A-R.1.1.2", openEnded: false, gen: () => {
                const p = rand(5, 30); const h = 1.5; const ans = (p / h).toFixed(1);
                return { q: `Type ${p} pages in ${h} hours. Pages per hour?`, ans: ans, distractors: [p.toString(), (p * h).toFixed(1), h.toString()], guide: `${p} ÷ ${h} = ${ans}.` };
            }},
            { type: "RatioEquation", anchor: "A-R.1.1.3", openEnded: false, gen: () => {
                const a = rand(2, 15); const b = rand(2, 12); const c = rand(2, 10);
                return { q: `Ratio A:B is ${a}:${b}. If A is ${c}, find equation for B (x).`, ans: `${c}/x = ${a}/${b}`, distractors: [`x/${c} = ${a}/${b}`, `${c}/${a} = x/${b}`, `${a}/${c} = ${b}/x`], guide: "Set up parts as equivalent fractions." };
            }},
            { type: "GraphUnitRate", anchor: "A-R.1.1.5", openEnded: false, gen: () => ({
                q: "On a proportional graph, the unit rate is the y-value when:", ans: "x = 1", distractors: ["x = 0", "y = 0", "x = y"], guide: "The point (1, r) represents the unit rate r."
            })},
            { type: "MassIncrease", anchor: "A-R.1.1.6", openEnded: false, gen: () => {
                const b = rand(200, 1500) / 100; const i = rand(200, 1800) / 100;
                return { q: `A ${b.toFixed(2)}kg object increases by ${i.toFixed(2)}kg. New mass?`, ans: (b + i).toFixed(2), distractors: [(i - b).toFixed(2), i.toFixed(2), (b * 2).toFixed(2)], guide: `${b.toFixed(2)} + ${i.toFixed(2)} = ${(b + i).toFixed(2)}.` };
            }},
            { type: "LinearSimplify", anchor: "B-E.1.1.1", openEnded: false, gen: () => {
                const p = rand(2, 10); const c = rand(10, 150);
                return { q: `Simplify 2(${p}p + ${c} + ${p}p)`, ans: `${p * 4}p + ${c * 2}`, distractors: [`${p * 2}p + ${c * 2}`, `${p * 4}p + ${c}`, `${p * 4 + c * 2}p`], guide: `2(${p * 2}p + ${c}) = ${p * 4}p + ${c * 2}.` };
            }},
            { type: "MentalPercent", anchor: "A-R.1.1.6", openEnded: false, gen: () => ({
                q: "To find 20% of a value, you can:", ans: "Find 10% and multiply by 2", distractors: ["Divide by 20", "Subtract 20", "Multiply by 20"], guide: "10% is a base that can be doubled for 20%."
            })},
            { type: "MapScale7", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const s = rand(3, 30); const i = 4.5;
                return { q: `Scale: 1 in = ${s} mi. 4.5 in = ?`, ans: (s * i).toString(), distractors: [s.toString(), i.toString(), (s + i).toString()], guide: `${i} × ${s} = ${s * i} miles.` };
            }},
            { type: "CirclePi", anchor: "C-G.1.1.2", openEnded: false, gen: () => {
                const r = rand(2, 20);
                return { q: `Diameter is ${r * 2}. Area in terms of π?`, ans: `${r * r}π`, distractors: [`${r * 2}π`, `${r * r * 4}π`, `${r}π`], guide: `Radius is ${r}. Area = πr² = ${r * r}π.` };
            }},
            { type: "Complementary7", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const a = rand(10, 80);
                return { q: `Angle A is ${a}°. Find its complement.`, ans: (90 - a).toString(), distractors: [(180 - a).toString(), a.toString(), "90"], guide: `90 - ${a} = ${90 - a}.` };
            }},
            { type: "BiasSampling", anchor: "D-S.1.1.1", openEnded: false, gen: () => ({
                q: "Surveying only the band members about the school menu is:", ans: "Biased", distractors: ["Random", "Systematic", "Normal"], guide: "It targets a specific subgroup rather than the whole population."
            })},
            { type: "MarbleProb", anchor: "D-P.1.1.1", openEnded: false, gen: () => {
                const r = rand(1, 15); const b = rand(3, 25); const total = r + b;
                return { q: `${r} red, ${b} blue. Prob of red?`, ans: `${r}/${total}`, distractors: [`${b}/${total}`, r.toString(), b.toString()], guide: `${r} / (${r}+${b}) = ${r}/${total}.` };
            }},
            { type: "ProportionalGraph7", anchor: "A-R.1.1.2", openEnded: false, gen: () => ({
                q: "Which graph represents a proportional relationship?", ans: "Straight line through (0,0)", distractors: ["Curved line", "Line through (0,5)", "Vertical line"], guide: "Proportionality requires a constant rate starting at the origin."
            })},

            // ===== 2023 GRADE 7 SET =====

            { type: "RationalMix", anchor: "A-N.1.1", openEnded: false, gen: () => ({
                q: "-0.31 × 4.2 ÷ 2 = ?", ans: "-0.651", distractors: ["0.651", "-1.3", "1.3"], guide: "Standard multiplication then division."
            })},
            { type: "ProbNot7", anchor: "D-P.1.1", openEnded: false, gen: () => {
                const n = rand(2, 10); const t = 12;
                return { q: `${n}/${t} are red. Prob NOT red?`, ans: `${t - n}/${t}`, distractors: [`${n}/${t}`, `1/${t}`, "1"], guide: `1 - ${n}/${t} = ${t - n}/${t}.` };
            }},
            { type: "TwoStepEq7", anchor: "B-E.2.2.1", openEnded: false, gen: () => {
                const x = rand(2, 20); const a = rand(2, 10); const b = rand(3, 30);
                return { q: `${a}x + ${b} = ${a * x + b}. x?`, ans: x.toString(), distractors: [b.toString(), a.toString(), (x + 5).toString()], guide: `Subtract ${b}, then divide by ${a}.` };
            }},
            { type: "ImproperRate", anchor: "A-R.1.1.1", openEnded: false, gen: () => ({
                q: "1/2 mile in 1/4 hour. Speed?", ans: "2 mph", distractors: ["1/8 mph", "4 mph", "0.5 mph"], guide: "1/2 ÷ 1/4 = 2."
            })},
            { type: "CircleCirc7", anchor: "C-G.1.1.2", openEnded: false, gen: () => {
                const r = rand(2, 25);
                return { q: `Radius ${r}. Circumference in π?`, ans: `${r * 2}π`, distractors: [`${r}π`, `${r * r}π`, `${r * 3}π`], guide: `2πr = ${r * 2}π.` };
            }},
            { type: "TaxTotal7", anchor: "A-R.1.1.6", openEnded: false, gen: () => {
                const p = rand(3, 50) * 10; const t = rand(3, 12);
                const tax = (p * t / 100);
                return { q: `$${p} item, ${t}% tax. Total?`, ans: (p + tax).toString(), distractors: [p.toString(), tax.toString(), (p * 2).toString()], guide: `${p} + (${t}% × ${p}) = ${p} + ${tax} = ${p + tax}.` };
            }},
            { type: "InequalityFlip7", anchor: "B-E.2.2.2", openEnded: false, gen: () => {
                const a = -rand(2, 12); const rhs = rand(10, 60); const ans = rhs / a;
                return { q: `${a}x < ${rhs}. Solve.`, ans: `x > ${ans}`, distractors: [`x < ${ans}`, `x > ${-ans}`, `x < ${-ans}`], guide: "Flip sign when dividing by negative." };
            }},
            { type: "BetterSample7", anchor: "D-S.1.1", openEnded: false, gen: () => ({
                q: "Which sample size is best for a school of 500?", ans: "100 random students", distractors: ["5 random students", "10 friends", "all teachers"], guide: "Larger random samples reduce margin of error."
            })},
            { type: "VerticalAngles7", anchor: "C-G.1.1.4", openEnded: false, gen: () => ({
                q: "Vertical angles are always:", ans: "Equal", distractors: ["90 degrees", "Supplementary", "Adjacent"], guide: "Vertical angles are opposite and congruent."
            })},
            { type: "PercentError7", anchor: "A-R.1.1", openEnded: false, gen: () => {
                const actual = rand(5, 60); const est = actual + rand(1, 15); const pct = ((est - actual) / actual * 100).toFixed(0);
                return { q: `Est ${est}, Actual ${actual}. % Error?`, ans: `${pct}%`, distractors: [`${est - actual}%`, `${actual}%`, "10%"], guide: `${est - actual} error / ${actual} actual = ${pct}%.` };
            }},
            { type: "CylinderCut7", anchor: "C-G.1.1.3", openEnded: false, gen: () => ({
                q: "Vertical slice of a cylinder?", ans: "Rectangle", distractors: ["Circle", "Triangle", "Oval"], guide: "The side profile is rectangular."
            })},
            { type: "ProbSimulate7", anchor: "D-P.1.1.3", openEnded: false, gen: () => ({
                q: "Flip coin 100 times. Expect heads?", ans: "about 50", distractors: ["exactly 50", "100", "0"], guide: "Prob 0.5 suggests half."
            })},
            { type: "ScaleFactorModel", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const scale = rand(2, 15); const real = scale * rand(2, 20);
                return { q: `Scale 1:${scale}. Real is ${real}. Model?`, ans: (real / scale).toString(), distractors: [(real * scale).toString(), (real - scale).toString(), (real + scale).toString()], guide: `${real} ÷ ${scale} = ${real / scale}.` };
            }},
            { type: "DiscountWord7", anchor: "A-R.1.1.6", openEnded: false, gen: () => {
                const price = rand(3, 30) * 10; const pct = rand(1, 5) * 10; const disc = price * pct / 100;
                return { q: `$${price}, ${pct}% off. Sale price?`, ans: (price - disc).toString(), distractors: [(price + disc).toString(), disc.toString(), price.toString()], guide: `${price} - ${disc} = ${price - disc}.` };
            }},
            { type: "IntegerProd7", anchor: "A-N.1.1", openEnded: false, gen: () => {
                const a = rand(2, 15); const b = rand(2, 12);
                return { q: `(-${a}) × (-${b}) = ?`, ans: (a * b).toString(), distractors: [(-(a * b)).toString(), (a + b).toString(), (-(a + b)).toString()], guide: "Neg × Neg = Pos." };
            }},
            { type: "UnitPrice7", anchor: "A-R.1.1", openEnded: false, gen: () => {
                const items = rand(2, 15); const price = items * rand(4, 25);
                return { q: `${items} shirts for $${price}. 1 shirt?`, ans: (price / items).toString(), distractors: [(price - items).toString(), items.toString(), price.toString()], guide: `${price} ÷ ${items} = ${price / items}.` };
            }},
            { type: "AddRational", anchor: "Add two rational numbers.", openEnded: false, gen: () => {
                const n1 = rand(1, 9); const d1 = choose([2, 3, 4, 5, 6, 8, 10]); const n2 = rand(1, 9); const d2 = choose([2, 3, 4, 5, 6, 8, 10]);
                const neg = choose([true, false]); const sign = neg ? -1 : 1;
                const lcd = (d1 * d2) / gcd(d1, d2);
                const numSum = sign * n1 * (lcd / d1) + n2 * (lcd / d2);
                const g = gcd(Math.abs(numSum), lcd); const simpNum = numSum / g; const simpDen = lcd / g;
                const ansStr = simpDen === 1 ? simpNum.toString() : `${simpNum}/${simpDen}`;
                return { q: `${neg ? '-' : ''}${n1}/${d1} + ${n2}/${d2} = ?`, ans: ansStr, distractors: [`${Math.abs(simpNum) + 1}/${simpDen}`, `${simpNum - 1}/${simpDen}`, `${n1 + n2}/${d1 + d2}`], guide: `LCD = ${lcd}. Convert: ${sign * n1 * (lcd / d1)}/${lcd} + ${n2 * (lcd / d2)}/${lcd} = ${numSum}/${lcd}. Simplify: ${ansStr}.` };
            }},
            { type: "SubtractRational", anchor: "Subtract rational numbers.", openEnded: false, gen: () => {
                const n1 = rand(1, 9); const d1 = choose([2, 3, 4, 5, 6, 8]); const n2 = rand(1, 9); const d2 = choose([2, 3, 4, 5, 6, 8]);
                const lcd = (d1 * d2) / gcd(d1, d2);
                const numDiff = n1 * (lcd / d1) - n2 * (lcd / d2);
                const g = gcd(Math.abs(numDiff), lcd); const simpNum = numDiff / g; const simpDen = lcd / g;
                const ansStr = simpDen === 1 ? simpNum.toString() : `${simpNum}/${simpDen}`;
                return { q: `${n1}/${d1} − ${n2}/${d2} = ?`, ans: ansStr, distractors: [`${simpNum + 1}/${simpDen}`, `${n1 - n2}/${d1 - d2 || 1}`, `${Math.abs(simpNum)}/${simpDen + 1}`], guide: `LCD = ${lcd}. Convert: ${n1 * (lcd / d1)}/${lcd} − ${n2 * (lcd / d2)}/${lcd} = ${numDiff}/${lcd}. Simplify: ${ansStr}.` };
            }},
            { type: "MultiplyRational", anchor: "Multiply rational numbers.", openEnded: false, gen: () => {
                const n1 = rand(1, 7); const d1 = choose([2, 3, 4, 5, 7]); const n2 = rand(1, 7); const d2 = choose([2, 3, 4, 5, 7]);
                const neg = choose([true, false]); const sign = neg ? -1 : 1;
                const numProd = sign * n1 * n2; const denProd = d1 * d2;
                const g = gcd(Math.abs(numProd), denProd); const sn = numProd / g; const sd = denProd / g;
                const ansStr = sd === 1 ? sn.toString() : `${sn}/${sd}`;
                return { q: `${neg ? '(-' : ''}${n1}/${d1}${neg ? ')' : ''} × ${n2}/${d2} = ?`, ans: ansStr, distractors: [`${-sn}/${sd}`, `${n1 + n2}/${d1 + d2}`, `${Math.abs(sn) + 1}/${sd}`], guide: `Multiply numerators: ${sign * n1} × ${n2} = ${numProd}. Multiply denominators: ${d1} × ${d2} = ${denProd}. Simplify: ${ansStr}.` };
            }},
            { type: "DivideRational", anchor: "Divide rational numbers.", openEnded: false, gen: () => {
                const n1 = rand(1, 8); const d1 = choose([2, 3, 4, 5, 6]); const n2 = rand(1, 8); const d2 = choose([2, 3, 4, 5, 6]);
                const neg = choose([true, false]); const sign = neg ? -1 : 1;
                const numProd = sign * n1 * d2; const denProd = d1 * n2;
                const g = gcd(Math.abs(numProd), denProd); const sn = numProd / g; const sd = denProd / g;
                const ansStr = sd === 1 ? sn.toString() : `${sn}/${sd}`;
                return { q: `${neg ? '(-' : ''}${n1}/${d1}${neg ? ')' : ''} ÷ ${n2}/${d2} = ?`, ans: ansStr, distractors: [`${sn}/${sd + 1}`, `${n1 * n2}/${d1 * d2}`, `${-sn}/${sd}`], guide: `Flip the second fraction and multiply: ${sign * n1}/${d1} × ${d2}/${n2} = ${numProd}/${denProd}. Simplify: ${ansStr}.` };
            }},
            { type: "ConstantOfProp", anchor: "Find k in y = kx.", openEnded: false, gen: () => {
                const k = rand(2, 15); const x1 = rand(1, 10); const y1 = k * x1; const x2 = rand(1, 10); const y2 = k * x2;
                return { q: `A table shows (${x1}, ${y1}) and (${x2}, ${y2}). Find the constant of proportionality k in y = kx.`, ans: k.toString(), distractors: [(k + 1).toString(), (k - 1).toString(), (x1 + x2).toString()], guide: `k = y / x = ${y1} / ${x1} = ${k}. Verify: ${y2} / ${x2} = ${k}.` };
            }},
            { type: "PercentMarkup", anchor: "Calculate selling price after markup.", openEnded: false, gen: () => {
                const cost = rand(10, 200); const pct = choose([10, 15, 20, 25, 30, 40, 50]);
                const markup = (cost * pct / 100); const selling = cost + markup;
                return { q: `A store buys an item for $${cost} and marks it up ${pct}%. What is the selling price?`, ans: `$${selling.toFixed(2)}`, distractors: [`$${markup.toFixed(2)}`, `$${(cost - markup).toFixed(2)}`, `$${(cost * 2).toFixed(2)}`], guide: `Markup = ${cost} × ${pct / 100} = $${markup.toFixed(2)}. Selling price = $${cost} + $${markup.toFixed(2)} = $${selling.toFixed(2)}.` };
            }},
            { type: "PercentMarkdown", anchor: "Calculate sale price after discount.", openEnded: false, gen: () => {
                const price = rand(20, 300); const pct = choose([10, 15, 20, 25, 30, 40, 50]);
                const discount = (price * pct / 100); const sale = price - discount;
                return { q: `An item is $${price}. It's on sale for ${pct}% off. What is the sale price?`, ans: `$${sale.toFixed(2)}`, distractors: [`$${discount.toFixed(2)}`, `$${(price + discount).toFixed(2)}`, `$${(price * pct / 10).toFixed(2)}`], guide: `Discount = ${price} × ${pct / 100} = $${discount.toFixed(2)}. Sale price = $${price} − $${discount.toFixed(2)} = $${sale.toFixed(2)}.` };
            }},
            { type: "PercentTaxCalc", anchor: "Calculate total with sales tax.", openEnded: false, gen: () => {
                const price = rand(5, 250); const taxPct = choose([5, 6, 7, 8, 9, 10]);
                const tax = (price * taxPct / 100); const total = price + tax;
                return { q: `An item costs $${price}. Sales tax is ${taxPct}%. What is the total?`, ans: `$${total.toFixed(2)}`, distractors: [`$${tax.toFixed(2)}`, `$${(price - tax).toFixed(2)}`, `$${(price * 2).toFixed(2)}`], guide: `Tax = ${price} × ${taxPct / 100} = $${tax.toFixed(2)}. Total = $${price} + $${tax.toFixed(2)} = $${total.toFixed(2)}.` };
            }},
            { type: "PercentTipCalc", anchor: "Calculate total with tip.", openEnded: false, gen: () => {
                const meal = rand(8, 120); const tipPct = choose([10, 15, 18, 20, 25]);
                const tip = (meal * tipPct / 100); const total = meal + tip;
                return { q: `A meal costs $${meal}. You leave a ${tipPct}% tip. What is the total?`, ans: `$${total.toFixed(2)}`, distractors: [`$${tip.toFixed(2)}`, `$${(meal - tip).toFixed(2)}`, `$${(meal + tipPct).toFixed(2)}`], guide: `Tip = ${meal} × ${tipPct / 100} = $${tip.toFixed(2)}. Total = $${meal} + $${tip.toFixed(2)} = $${total.toFixed(2)}.` };
            }},
            { type: "SimpleInterest", anchor: "I = P × r × t.", openEnded: false, gen: () => {
                const P = choose([100, 200, 500, 1000, 1500, 2000, 5000]); const rPct = choose([2, 3, 4, 5, 6, 8, 10]); const t = rand(1, 10);
                const I = (P * rPct / 100 * t);
                return { q: `Find the simple interest: P = $${P}, rate = ${rPct}%, time = ${t} years.`, ans: `$${I.toFixed(2)}`, distractors: [`$${(P * rPct / 100).toFixed(2)}`, `$${(P + I).toFixed(2)}`, `$${(I * 2).toFixed(2)}`], guide: `I = P × r × t = ${P} × ${rPct / 100} × ${t} = $${I.toFixed(2)}.` };
            }},
            { type: "TwoStepEquation", anchor: "Solve ax + b = c.", openEnded: false, gen: () => {
                const x = rand(-10, 10); const a = rand(2, 12); const b = rand(-20, 20); const c = a * x + b;
                return { q: `Solve: ${a}x + ${b >= 0 ? b : '(' + b + ')'} = ${c}`, ans: x.toString(), distractors: [(x + 1).toString(), (x - 1).toString(), (-x).toString()], guide: `Subtract ${b}: ${a}x = ${c} − ${b} = ${c - b}. Divide by ${a}: x = ${(c - b) / a}.` };
            }},
            { type: "TwoStepInequality", anchor: "Solve ax + b > c.", openEnded: false, gen: () => {
                const x = rand(1, 10); const a = rand(2, 8); const b = rand(-15, 15); const c = a * x + b;
                const op = choose(['>', '<', '≥', '≤']);
                return { q: `Solve: ${a}x + ${b >= 0 ? b : '(' + b + ')'} ${op} ${c}`, ans: `x ${op} ${x}`, distractors: [`x ${op} ${x + 1}`, `x ${op} ${x - 1}`, `x ${op} ${-x}`], guide: `Subtract ${b}: ${a}x ${op} ${c - b}. Divide by ${a} (positive, so sign stays): x ${op} ${x}.` };
            }},
            { type: "DistributiveEquation", anchor: "Solve a(x + b) = c.", openEnded: false, gen: () => {
                const x = rand(-8, 8); const a = rand(2, 9); const b = rand(-10, 10); const c = a * (x + b);
                return { q: `Solve: ${a}(x + ${b >= 0 ? b : '(' + b + ')'}) = ${c}`, ans: x.toString(), distractors: [(x + 1).toString(), (x - 1).toString(), (c / a).toString()], guide: `Divide both sides by ${a}: x + ${b} = ${c / a}. Subtract ${b}: x = ${c / a} − ${b} = ${x}.` };
            }},
            { type: "ComplementaryAngles", anchor: "Two angles sum to 90°.", openEnded: false, gen: () => {
                const a = rand(10, 80); const b = 90 - a;
                return { q: `Two complementary angles: one is ${a}°. Find the other.`, ans: `${b}°`, distractors: [`${180 - a}°`, `${a}°`, `${b + 10}°`], guide: `Complementary angles sum to 90°. Other = 90° − ${a}° = ${b}°.` };
            }},
            { type: "SupplementaryAngles", anchor: "Two angles sum to 180°.", openEnded: false, gen: () => {
                const a = rand(10, 170); const b = 180 - a;
                return { q: `Two supplementary angles: one is ${a}°. Find the other.`, ans: `${b}°`, distractors: [`${90 - a < 0 ? a - 90 : 90 - a}°`, `${a}°`, `${b + 5}°`], guide: `Supplementary angles sum to 180°. Other = 180° − ${a}° = ${b}°.` };
            }},
            { type: "TriangleAngleSum", anchor: "Three angles sum to 180°.", openEnded: false, gen: () => {
                const a = rand(20, 80); const b = rand(20, 140 - a); const c = 180 - a - b;
                return { q: `A triangle has angles ${a}° and ${b}°. Find the third angle.`, ans: `${c}°`, distractors: [`${a + b}°`, `${c + 10}°`, `${180 - a}°`], guide: `Triangle angles sum to 180°. Third = 180° − ${a}° − ${b}° = ${c}°.` };
            }},
            { type: "CircumferenceCalc", anchor: "C = 2πr or πd.", openEnded: false, gen: () => {
                const r = rand(1, 30); const C = (2 * Math.PI * r).toFixed(1);
                return { q: `Find the circumference of a circle with radius ${r}. Round to one decimal.`, ans: C, distractors: [(Math.PI * r * r).toFixed(1), (2 * r).toString(), (Math.PI * r).toFixed(1)], guide: `C = 2πr = 2 × π × ${r} = ${C}.` };
            }},
            { type: "CircleAreaCalc", anchor: "A = πr².", openEnded: false, gen: () => {
                const r = rand(1, 20); const A = (Math.PI * r * r).toFixed(1);
                return { q: `Find the area of a circle with radius ${r}. Round to one decimal.`, ans: A, distractors: [(2 * Math.PI * r).toFixed(1), (r * r).toString(), (Math.PI * r).toFixed(1)], guide: `A = πr² = π × ${r}² = π × ${r * r} = ${A}.` };
            }},
            { type: "ScaleFactorCalc", anchor: "Find scale factor of similar shapes.", openEnded: false, gen: () => {
                const k = rand(2, 8); const side1 = rand(2, 15); const side2 = side1 * k;
                return { q: `Two similar rectangles have corresponding sides ${side1} and ${side2}. What is the scale factor?`, ans: k.toString(), distractors: [(k + 1).toString(), (side2 - side1).toString(), (k - 1).toString()], guide: `Scale factor = larger ÷ smaller = ${side2} ÷ ${side1} = ${k}.` };
            }},
            { type: "ProbabilityCalc", anchor: "P = favorable / total.", openEnded: false, gen: () => {
                const fav = rand(1, 10); const extra = rand(1, 20); const total = fav + extra;
                const g = gcd(fav, total); const sn = fav / g; const sd = total / g;
                const ansStr = sd === 1 ? sn.toString() : `${sn}/${sd}`;
                return { q: `A bag has ${total} marbles, ${fav} are red. What is P(red)?`, ans: ansStr, distractors: [`${extra}/${total}`, `${fav}/${extra}`, `1/${total}`], guide: `P(red) = favorable / total = ${fav}/${total}. Simplified: ${ansStr}.` };
            }},
            { type: "CompoundProbCalc", anchor: "P(A and B) = P(A) × P(B).", openEnded: false, gen: () => {
                const n1 = rand(1, 5); const d1 = rand(n1 + 1, 10); const n2 = rand(1, 5); const d2 = rand(n2 + 1, 10);
                const numProd = n1 * n2; const denProd = d1 * d2;
                const g = gcd(numProd, denProd); const sn = numProd / g; const sd = denProd / g;
                const ansStr = sd === 1 ? sn.toString() : `${sn}/${sd}`;
                return { q: `P(A) = ${n1}/${d1} and P(B) = ${n2}/${d2}. If A and B are independent, find P(A and B).`, ans: ansStr, distractors: [`${n1 + n2}/${d1 + d2}`, `${sn + 1}/${sd}`, `${n1}/${d2}`], guide: `P(A and B) = P(A) × P(B) = ${n1}/${d1} × ${n2}/${d2} = ${numProd}/${denProd}. Simplified: ${ansStr}.` };
            }}
        ],
        8: [
            { type: "Sci Note", anchor: "Use powers of 10 to estimate.", openEnded: false, gen: () => {
                const e1 = rand(6, 10); const e2 = rand(1, 4); const ans = e1 - e2;
                return { q: `Light travels at 10<sup>${e1}</sup> m/s. Sound at 10<sup>${e2}</sup> m/s. How many powers of 10 faster is light?`, ans: `10<sup>${ans}</sup>`, distractors: [`10<sup>${e1+e2}</sup>`, `10<sup>${Math.abs(ans-2)}</sup>`, `${ans}`], guide: `Divide by subtracting exponents: ${e1} - ${e2} = ${ans}.` };
            }},
            { type: "Rational", anchor: "Rational vs Irrational.", openEnded: false, gen: () => {
                const perfect = [4, 9, 16, 25, 36]; const pIdx = rand(0, perfect.length-1);
                const nonPerfect = [2, 3, 5, 7, 10, 11]; const nIdx = rand(0, nonPerfect.length-1);
                return { q: `Which pair contains one rational and one irrational number?`, ans: `√${perfect[pIdx]} and √${nonPerfect[nIdx]}`, distractors: [`√${perfect[0]} and √${perfect[2]}`, `√${nonPerfect[0]} and √${nonPerfect[1]}`, `√1 and √${perfect[1]}`], guide: `√${perfect[pIdx]} = ${Math.sqrt(perfect[pIdx])} (rational). √${nonPerfect[nIdx]} is irrational.` };
            }},
            { type: "Exponents", anchor: "Properties of integer exponents.", openEnded: false, gen: () => {
                const base = rand(2, 7); const a = rand(2, 5); const b = rand(2, 4); const ans = a * b;
                return { q: `Simplify (${base}<sup>${a}</sup>)<sup>${b}</sup>.`, ans: `${base}<sup>${ans}</sup>`, distractors: [`${base}<sup>${a+b}</sup>`, `${base}<sup>${a}</sup>`, `${base*b}<sup>${a}</sup>`], guide: `Power of a power rule: multiply exponents. ${a} × ${b} = ${ans}.` };
            }},
            { type: "Slope Int", anchor: "Interpret y = mx + b.", openEnded: false, gen: () => {
                const fee = rand(30, 80) / 100; const rate = rand(10, 25) / 100; const days = rand(2, 5); const ans = (fee + rate * days).toFixed(2);
                return { q: `A library has a $${fee.toFixed(2)} fee and charges $${rate.toFixed(2)} per day overdue. Cost for ${days} days?`, ans: `$${ans}`, distractors: [`$${(fee*days).toFixed(2)}`, `$${(rate*days).toFixed(2)}`, `$${(fee+rate).toFixed(2)}`], guide: `y = ${fee.toFixed(2)} + ${rate.toFixed(2)} × ${days} = $${ans}.` };
            }},
            { type: "Functions", anchor: "Construct linear functions.", openEnded: false, gen: () => {
                const m = rand(15, 45) / 10; const b = rand(100, 400);
                return { q: `A line has a slope of ${m} and a y-intercept of ${b}. Which equation models this?`, ans: `y = ${m}x + ${b}`, distractors: [`y = ${m}x`, `y = ${b}x`, `y = ${b}x + ${m}`], guide: `Substitute into y = mx + b: y = ${m}x + ${b}.` };
            }},
            { type: "Transform", anchor: "Effect of transformations.", openEnded: false, gen: () => {
                const angle = choose([90, 180, 270]); const scale = rand(2, 4);
                return { q: `If you rotate a shape ${angle}° and then dilate it by a factor of ${scale}, this is a sequence of:`, ans: "a rotation and a dilation", distractors: ["two translations", "two reflections", "a single translation"], guide: `A rotation changes orientation; a dilation changes size. Together they are a sequence of transformations.` };
            }},
            { type: "Pythag", anchor: "Pythagorean Theorem.", openEnded: false, gen: () => {
                const a = rand(3, 8); const b = rand(a+1, 12); const cSq = a*a + b*b;
                return { q: `A right triangle has legs of ${a} and ${b}. What is the square of the hypotenuse?`, ans: cSq.toString(), distractors: [(a+b).toString(), (a*b).toString(), (cSq-1).toString()], guide: `a² + b² = c². ${a}² + ${b}² = ${a*a} + ${b*b} = ${cSq}.` };
            }},
            { type: "Cylinder", anchor: "Volume of cylinders.", openEnded: false, gen: () => {
                const h = rand(20, 40); const d = rand(6, 12); const r = d/2; const pieces = rand(4, 8);
                const vol = Math.PI * r * r * h; const ans = Math.round(vol / pieces);
                return { q: `A cylinder with height ${h} and diameter ${d} is cut into ${pieces} equal pieces. Approximate volume of one piece?`, ans: ans.toString(), distractors: [Math.round(vol).toString(), Math.round(vol/(pieces*2)).toString(), (r*r*h).toString()], guide: `Total V = π(${r}²)(${h}) ≈ ${Math.round(vol)}. Divide by ${pieces} ≈ ${ans}.` };
            }},
            { type: "Slope", anchor: "Find slope of a function.", openEnded: false, gen: () => {
                const x1 = 0; const y1 = rand(1, 60); const x2 = rand(2, 40); const y2 = y1 + rand(2, 80);
                const rise = y2 - y1; const run = x2 - x1; const ans = rise / run;
                return { q: `Find the slope of a line passing through (${x1}, ${y1}) and (${x2}, ${y2}).`, ans: Number.isInteger(ans) ? ans.toString() : ans.toFixed(1), distractors: [rise.toString(), y1.toString(), run.toString()], guide: `(${y2} - ${y1}) / (${x2} - ${x1}) = ${rise} / ${run} = ${Number.isInteger(ans) ? ans : ans.toFixed(1)}.` };
            }},
            { type: "Systems", anchor: "Solve systems of equations.", openEnded: false, gen: () => {
                const x = rand(2, 20); const b1 = rand(1, 25); const m2 = rand(2, 15); const b2 = x + b1 - m2 * x;
                const y = x + b1;
                return { q: `Solve: y = x + ${b1} and y = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}.`, ans: `(${x}, ${y})`, distractors: [`(${x-1}, ${y})`, `(${x}, ${y-1})`, `(${x+1}, ${y+1})`], guide: `x + ${b1} = ${m2}x ${b2 >= 0 ? '+ ' + b2 : '- ' + Math.abs(b2)}. Solve: x = ${x}. y = ${x} + ${b1} = ${y}.` };
            }},
            { type: "Comp Func", anchor: "Compare two functions.", openEnded: false, gen: () => {
                const r1 = rand(2, 30); const r2 = rand(1, r1 - 1);
                return { q: `Function A has a rate of change of ${r1}. Function B has a rate of change of ${r2}. Which has a steeper slope?`, ans: "Function A", distractors: ["Function B", "They are equal", "Neither"], guide: `A higher rate of change (${r1} > ${r2}) means a steeper slope.` };
            }},
            { type: "Scatter", anchor: "Construct scatter plots.", openEnded: false, gen: () => {
                return { q: `On a scatter plot, if points trend upward from left to right, it shows:`, ans: "Positive association", distractors: ["Negative association", "No association", "Non-linear"], guide: `As one variable increases, the other increases. This is a positive association.` };
            }},
            { type: "Sphere", anchor: "Volume of spheres.", openEnded: false, gen: () => {
                const r = rand(2, 30); const ans = Math.round(4/3 * Math.pow(r, 3) * 100) / 100;
                return { q: `A sphere has a radius of ${r}. What is its volume in terms of π?`, ans: `${ans}π`, distractors: [`${r*r}π`, `${r*r*r}π`, `${Math.round(ans/2)}π`], guide: `V = 4/3 πr³ = 4/3 × ${r}³ = 4/3 × ${r*r*r} = ${ans}π.` };
            }},
            { type: "Triangle", anchor: "Sum of triangle angles.", openEnded: false, gen: () => {
                const a = rand(10, 100); const b = rand(10, 150 - a); const ans = 180 - (a + b);
                return { q: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, ans: `${ans}°`, distractors: [`${a+b}°`, `180°`, `${ans+10}°`], guide: `Triangle angles sum to 180°. 180 - (${a} + ${b}) = 180 - ${a+b} = ${ans}.` };
            }},
            { type: "Rep Dec", anchor: "Convert decimal to fraction.", openEnded: false, gen: () => {
                return { q: `What is the fraction form of 3.1888...?`, ans: "3 17/90", distractors: ["3 17/99", "3 18/90", "3 1/8"], guide: `3.1 + 0.0888... = 31/10 + 8/90 = 279/90 + 8/90 = 287/90 = 3 17/90.` };
            }},
            { type: "Roots", anchor: "Approximate irrational numbers.", openEnded: false, gen: () => {
                const a = rand(2, 20); const b = a + rand(1, 10); const va = rand(12, 30); const vb = va - rand(1, 10);
                const sq1 = a*a*vb; const sq2 = b*b*va;
                return { q: `Compare ${a}√${vb} and ${b}√${va}.`, ans: sq1 < sq2 ? `${a}√${vb} < ${b}√${va}` : `${a}√${vb} > ${b}√${va}`, distractors: [sq1 < sq2 ? `${a}√${vb} > ${b}√${va}` : `${a}√${vb} < ${b}√${va}`, "Equal", "Cannot compare"], guide: `Square both: (${a}√${vb})² = ${sq1}. (${b}√${va})² = ${sq2}. ${sq1} ${sq1 < sq2 ? '<' : '>'} ${sq2}.` };
            }},
            { type: "CubeRoot", anchor: "A-N.1.1.5", openEnded: false, gen: () => {
                const bases = [2, 3, 4, 5, 6, 7, 8, 9, 10]; const base = bases[rand(0, bases.length - 1)]; const cube = base * base * base;
                return { q: `What is the cube root of ${cube}?`, ans: base.toString(), distractors: [(base + 1).toString(), (base - 1).toString(), (cube / 3).toString()], guide: `∛${cube} = ${base} because ${base} × ${base} × ${base} = ${cube}.` };
            }},
            { type: "ConeVol", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const r = rand(2, 30); const h = rand(4, 50); const vol = (Math.PI * r * r * h / 3); const ansRound = Math.round(vol * 100) / 100;
                return { q: `Find the volume of a cone with radius ${r} and height ${h}. Round to the nearest hundredth.`, ans: ansRound.toFixed(2), distractors: [Math.round(Math.PI * r * r * h).toString(), (r * r * h).toString(), Math.round(vol).toString()], guide: `V = 1/3 × π × r² × h = 1/3 × π × ${r * r} × ${h} = ${ansRound.toFixed(2)}.` };
            }},
            { type: "ExtAngle", anchor: "C-G.1.1.2", openEnded: false, gen: () => {
                const a = rand(10, 100); const b = rand(10, 110); const ext = a + b;
                return { q: `In a triangle, two remote interior angles measure ${a}° and ${b}°. What is the exterior angle?`, ans: `${ext}°`, distractors: [`${180 - ext}°`, `${a}°`, `180°`], guide: `The exterior angle equals the sum of the two remote interior angles: ${a}° + ${b}° = ${ext}°.` };
            }},
            { type: "Bivariate", anchor: "D-S.1.1.2", openEnded: false, gen: () => {
                return { q: `A line of best fit on a scatter plot is used to:`, ans: "Make predictions about data trends", distractors: ["Find the exact values", "Calculate the mean", "Determine the mode"], guide: `A line of best fit approximates the trend in data and is used to predict values within or beyond the data set.` };
            }},
            { type: "TwoWay", anchor: "D-S.1.1.3", openEnded: false, gen: () => {
                const a = rand(5, 150); const b = rand(5, 150); const c = rand(5, 150); const d = rand(5, 150);
                const total = a + b + c + d;
                return { q: `A two-way table shows: Group A Yes=${a}, No=${b}; Group B Yes=${c}, No=${d}. What fraction of all people said Yes?`, ans: `${a + c}/${total}`, distractors: [`${a}/${a + b}`, `${a + b}/${total}`, `${c}/${total}`], guide: `Total Yes = ${a} + ${c} = ${a + c}. Total people = ${total}. Fraction = ${a + c}/${total}.` };
            }},
            { type: "DistForm", anchor: "C-G.1.1", openEnded: false, gen: () => {
                const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [9, 40, 41], [12, 16, 20], [15, 20, 25], [10, 24, 26], [20, 21, 29], [11, 60, 61], [12, 35, 37], [15, 36, 39], [16, 30, 34], [18, 24, 30], [21, 28, 35], [24, 32, 40]];
                const t = triples[rand(0, triples.length - 1)];
                return { q: `Find the distance from the origin (0, 0) to the point (${t[0]}, ${t[1]}).`, ans: t[2].toString(), distractors: [(t[0] + t[1]).toString(), (t[2] + 1).toString(), Math.abs(t[0] - t[1]).toString()], guide: `Distance = √(${t[0]}² + ${t[1]}²) = √(${t[0] * t[0]} + ${t[1] * t[1]}) = √${t[2] * t[2]} = ${t[2]}.` };
            }},
            { type: "InfSols", anchor: "B-E.3.1", openEnded: false, gen: () => {
                return { q: `How many solutions does the equation 2(x + 3) = 2x + 6 have?`, ans: "Infinitely many", distractors: ["One", "None", "Two"], guide: `Distribute: 2x + 6 = 2x + 6. Both sides are identical, so every value of x is a solution.` };
            }},
            { type: "Translation", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const x = rand(1, 30); const y = rand(1, 30); const dx = rand(1, 25); const dy = rand(1, 25);
                return { q: `Translate the point (${x}, ${y}) right ${dx} units and up ${dy} units. What are the new coordinates?`, ans: `(${x + dx}, ${y + dy})`, distractors: [`(${x - dx}, ${y + dy})`, `(${x + dx}, ${y - dy})`, `(${x + dy}, ${y + dx})`], guide: `Right ${dx}: x becomes ${x} + ${dx} = ${x + dx}. Up ${dy}: y becomes ${y} + ${dy} = ${y + dy}. New point: (${x + dx}, ${y + dy}).` };
            }},
            { type: "NegSlope", anchor: "B-E.2", openEnded: false, gen: () => {
                return { q: `A line on a graph goes downward from left to right. Its slope is:`, ans: "Negative", distractors: ["Positive", "Zero", "Undefined"], guide: `A line that falls from left to right has a negative slope because as x increases, y decreases.` };
            }},
            { type: "PerfectSquare", anchor: "A-N.1.1", openEnded: false, gen: () => {
                const n = rand(2, 40); const sq = n * n;
                return { q: `What is √${sq}?`, ans: n.toString(), distractors: [(n + 1).toString(), (n - 1).toString(), (sq / 2).toString()], guide: `√${sq} = ${n} because ${n} × ${n} = ${sq}.` };
            }},

            // ===== 2024 GRADE 8 SET =====

            { type: "SciNoteFaster", anchor: "A-N.1.1.1", openEnded: false, gen: () => {
                const e1 = rand(5, 30); const e2 = rand(1, 15);
                return { q: `10^${e1} vs 10^${e2}. How many times faster?`, ans: `10^${e1 - e2}`, distractors: [`10^${e1 + e2}`, `10^${Math.floor(e1 / e2)}`, (e1 - e2).toString()], guide: `Subtract exponents: ${e1} - ${e2} = ${e1 - e2}.` };
            }},
            { type: "RationalIrrational8", anchor: "A-N.1.1.1", openEnded: false, gen: () => {
                const perf = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256][rand(0, 14)]; const nonPerf = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53][rand(0, 15)];
                return { q: `Which pair has one rational and one irrational?`, ans: `√${perf} and √${nonPerf}`, distractors: [`√${perf} and √${perf}`, `√${nonPerf} and √${nonPerf + 2}`, `${Math.sqrt(perf)} and ${Math.sqrt(perf) + 1}`], guide: `√${perf} = ${Math.sqrt(perf)} (rational); √${nonPerf} is irrational.` };
            }},
            { type: "RepeatingDec", anchor: "A-N.1.1.2", openEnded: false, gen: () => ({
                q: "3.188... as a fraction?", ans: "3 17/90", distractors: ["3 17/99", "3 1/8", "3 18/90"], guide: "3.1 + 8/90 = 3 17/90."
            })},
            { type: "CompareRoots", anchor: "A-N.1.1.4", openEnded: false, gen: () => ({
                q: "Compare 5√7 and 7√5.", ans: "5√7 < 7√5", distractors: ["5√7 > 7√5", "Equal", "None"], guide: "√175 < √245."
            })},
            { type: "ExponentPower", anchor: "B-E.1.1.1", openEnded: false, gen: () => {
                const a = rand(2, 12); const b = rand(2, 12); const base = rand(2, 15);
                return { q: `(${base}^${a})^${b} = ?`, ans: `${base}^${a * b}`, distractors: [`${base}^${a + b}`, `${base}^${a}`, (a * b).toString()], guide: `Multiply the exponents: ${a} × ${b} = ${a * b}.` };
            }},
            { type: "SlopeFee", anchor: "B-E.3.1.3", openEnded: false, gen: () => {
                const fee = rand(20, 400) / 100; const daily = rand(5, 120) / 100; const days = rand(2, 30);
                const ans = (fee + daily * days).toFixed(2);
                return { q: `$${fee.toFixed(2)} fee + $${daily.toFixed(2)}/day. Cost for ${days} days?`, ans: `$${ans}`, distractors: [`$${(fee + daily).toFixed(2)}`, `$${(daily * days).toFixed(2)}`, `$${(fee * days).toFixed(2)}`], guide: `${fee.toFixed(2)} + ${days}(${daily.toFixed(2)}) = $${ans}.` };
            }},
            { type: "LineEqModel", anchor: "B-F.1.1.1", openEnded: false, gen: () => {
                const m = rand(2, 25); const b = rand(50, 2000);
                return { q: `Slope ${m}, Y-int ${b}. Equation?`, ans: `y = ${m}x + ${b}`, distractors: [`y = ${m}x`, `y = ${b}x`, `y = ${b}x + ${m}`], guide: `Use y = mx + b.` };
            }},
            { type: "Pythagorean8", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const a = rand(3, 30); const b = rand(4, 40);
                return { q: `Legs ${a} and ${b}. Hypotenuse squared?`, ans: (a * a + b * b).toString(), distractors: [(a + b).toString(), (a * b).toString(), "100"], guide: `a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}.` };
            }},
            { type: "CylinderCut8", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const r = rand(3, 25); const h = rand(12, 150); const cuts = rand(2, 20);
                const vol = Math.round(Math.PI * r * r * h / cuts);
                return { q: `Diam ${r * 2}, Height ${h}. Cut into ${cuts}. Vol of 1?`, ans: vol.toString(), distractors: [Math.round(vol / 2).toString(), Math.round(vol * cuts).toString(), (r * r).toString()], guide: `π(${r}²)${h} / ${cuts} ≈ ${vol}.` };
            }},
            { type: "SlopePoints8", anchor: "B-E.2.1.1", openEnded: false, gen: () => {
                const y1 = rand(2, 40); const rise = rand(2, 36); const y2 = y1 + rise;
                return { q: `Slope from (0,${y1}) to (2,${y2})?`, ans: (rise / 2).toString(), distractors: [rise.toString(), "0.5", y1.toString()], guide: `(${y2}-${y1})/(2-0) = ${rise}/2 = ${rise / 2}.` };
            }},
            { type: "EquationSolution8", anchor: "B-E.3.1.5", openEnded: false, gen: () => {
                const x = rand(2, 25); const b1 = rand(1, 25); const y = x + b1;
                return { q: `Solve: y=x+${b1}, y=2x-${x - b1}.`, ans: `(${x}, ${y})`, distractors: [`(${y}, ${x})`, `(${b1}, ${x})`, "(0,0)"], guide: `x+${b1} = 2x-${x - b1} → x=${x}, y=${y}.` };
            }},
            { type: "RateComparison8", anchor: "B-F.1.1.1", openEnded: false, gen: () => {
                const m1 = rand(2, 30); const m2 = rand(1, m1 - 1);
                return { q: `Which is steeper: y=${m1}x or y=${m2}x?`, ans: `y=${m1}x`, distractors: [`y=${m2}x`, "Equal", "Neither"], guide: "Higher absolute slope = steeper." };
            }},
            { type: "ScatterTrend8", anchor: "D-S.1.1.1", openEnded: false, gen: () => ({
                q: "Points moving up/right indicates:", ans: "Positive association", distractors: ["Negative", "No association", "Curved"], guide: "Same direction move = positive."
            })},
            { type: "SphereVolume8", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const r = rand(2, 30); const vol = Math.round(4 / 3 * r * r * r);
                return { q: `Radius ${r} sphere volume in π?`, ans: `${vol}π`, distractors: [`${r * r}π`, `${r * r * r}π`, `${4 * r}π`], guide: `4/3 × π × r³ = 4/3 × ${r * r * r} = ${vol}π.` };
            }},
            { type: "TriangleMissing8", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const a = rand(10, 100); const b = rand(10, 150 - a);
                return { q: `Angles ${a}°, ${b}°. 3rd angle?`, ans: (180 - a - b).toString(), distractors: [(a + b).toString(), "180", (90 - a).toString()], guide: `Sum is 180. 180 - ${a} - ${b} = ${180 - a - b}.` };
            }},
            { type: "RationalID8", anchor: "A-N.1.1.1", openEnded: false, gen: () => {
                const perf = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400][rand(0, 18)];
                return { q: `Which is rational?`, ans: `√${perf}`, distractors: ["√2", "π", "√10"], guide: `√${perf} = ${Math.sqrt(perf)}.` };
            }},

            // ===== 2023 GRADE 8 SET =====

            { type: "CubeRootID8", anchor: "A-N.1.1.5", openEnded: false, gen: () => {
                const n = rand(2, 20);
                return { q: `∛${n * n * n} = ?`, ans: n.toString(), distractors: [(n * n).toString(), "1", (n * n * n).toString()], guide: `${n}×${n}×${n} = ${n * n * n}.` };
            }},
            { type: "SciNoteMult8", anchor: "B-E.1.1.2", openEnded: false, gen: () => {
                const a = rand(1, 9); const b = rand(1, 9); const e1 = rand(2, 18); const e2 = rand(2, 18);
                return { q: `(${a}×10^${e1}) × (${b}×10^${e2}) = ?`, ans: `${a * b}×10^${e1 + e2}`, distractors: [`${a * b}×10^${e1 * e2}`, `${a + b}×10^${e1 + e2}`, `${a * b}×10^${e1}`], guide: `Mult numbers: ${a}×${b}=${a * b}. Add exponents: ${e1}+${e2}=${e1 + e2}.` };
            }},
            { type: "Linearity8", anchor: "B-F.1.1", openEnded: false, gen: () => {
                const m = rand(2, 30); const b = rand(1, 60);
                return { q: `Which is a linear function?`, ans: `y = ${m}x + ${b}`, distractors: ["y = x²", "y = 1/x", "y = |x|"], guide: "Linear functions have x to the first power." };
            }},
            { type: "SlopeTriangles8", anchor: "B-E.2.1", openEnded: false, gen: () => ({
                q: "Slope triangles on the same line are always:", ans: "Similar", distractors: ["Congruent", "Equal area", "Isosceles"], guide: "They have proportional sides/angles."
            })},
            { type: "ConeVolPi8", anchor: "C-G.1.1.4", openEnded: false, gen: () => {
                const r = rand(2, 25); const h = rand(3, 50); const vol = Math.round(r * r * h / 3);
                return { q: `R=${r}, H=${h} cone volume in π?`, ans: `${vol}π`, distractors: [`${r * r * h}π`, `${r * h}π`, `${vol * 3}π`], guide: `1/3 × π × r² × h = 1/3 × ${r * r} × ${h} = ${vol}π.` };
            }},
            { type: "ExteriorAngleSum8", anchor: "C-G.1.1.2", openEnded: false, gen: () => {
                const a = rand(10, 100); const b = rand(10, 110);
                return { q: `Exterior angle of remote ${a}°, ${b}°?`, ans: (a + b).toString(), distractors: [(a - b).toString(), "180", (90 - a).toString()], guide: `Sum of remote interiors: ${a} + ${b} = ${a + b}.` };
            }},
            { type: "LineBestFit8", anchor: "D-S.1.1.2", openEnded: false, gen: () => ({
                q: "Best fit lines are used for:", ans: "Predictions", distractors: ["Definitions", "Exact results", "Ranges"], guide: "Used to estimate values."
            })},
            { type: "ProbNo8", anchor: "D-S.1.1.3", openEnded: false, gen: () => {
                const total = rand(55, 150); const yes = rand(2, 50); const no = total - yes;
                return { q: `${total} people, ${yes} say yes. Prob NO?`, ans: (no / total).toFixed(2), distractors: [(yes / total).toFixed(2), no.toString(), yes.toString()], guide: `${no}/${total} = ${(no / total).toFixed(2)}.` };
            }},
            { type: "OriginDist8", anchor: "C-G.1.1", openEnded: false, gen: () => {
                const pairs = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [15, 20, 25], [10, 24, 26], [20, 21, 29], [12, 35, 37], [15, 36, 39], [16, 30, 34], [18, 24, 30], [21, 28, 35], [24, 32, 40]]; const p = pairs[rand(0, pairs.length - 1)];
                return { q: `Distance from (0,0) to (${p[0]},${p[1]})?`, ans: p[2].toString(), distractors: [(p[0] + p[1]).toString(), (p[0] * p[1]).toString(), (p[2] + 1).toString()], guide: `√(${p[0]}²+${p[1]}²) = √${p[0] * p[0] + p[1] * p[1]} = ${p[2]}.` };
            }},
            { type: "EquationTypes8", anchor: "B-E.3.1", openEnded: false, gen: () => {
                const a = rand(2, 40);
                return { q: `${a}x = ${a}x has how many solutions?`, ans: "Infinite", distractors: ["0", "1", "2"], guide: "Left side always equals right side." };
            }},
            { type: "RadicalBounds8", anchor: "A-N.1.1.4", openEnded: false, gen: () => {
                const lo = rand(2, 30); const inner = lo * lo + rand(1, lo * 3);
                return { q: `√${inner} is between:`, ans: `${lo} and ${lo + 1}`, distractors: [`${lo - 1} and ${lo}`, `${lo + 1} and ${lo + 2}`, `${inner} and ${inner + 1}`], guide: `${lo}²=${lo * lo}, ${lo + 1}²=${(lo + 1) * (lo + 1)}. ${inner} is between.` };
            }},
            { type: "SetFunction8", anchor: "B-F.1.1.1", openEnded: false, gen: () => ({
                q: "A set where each X has one Y is a:", ans: "Function", distractors: ["Relation", "Slope", "Scalar"], guide: "Function definition."
            })},
            { type: "ShiftPoint8", anchor: "C-G.1.1.1", openEnded: false, gen: () => {
                const x = rand(1, 35); const y = rand(1, 35); const dy = rand(2, 25);
                return { q: `Point (${x},${y}) shifted up ${dy}?`, ans: `(${x}, ${y + dy})`, distractors: [`(${x + dy},${y})`, `(${x},${y - dy})`, `(${x - dy},${y})`], guide: `Add ${dy} to Y: (${x}, ${y + dy}).` };
            }},
            { type: "DilationScale8", anchor: "C-G.1.1", openEnded: false, gen: () => {
                const x = rand(1, 20); const y = rand(1, 20); const s = rand(2, 15);
                return { q: `Dilation scale ${s} on (${x},${y})?`, ans: `(${x * s}, ${y * s})`, distractors: [`(${x + s},${y + s})`, `(${x},${y * s})`, `(${x * s},${y})`], guide: `Multiply both: (${x * s}, ${y * s}).` };
            }},
            { type: "SlopeDecreasing8", anchor: "B-E.2", openEnded: false, gen: () => ({
                q: "A line that falls from left to right has a:", ans: "Negative slope", distractors: ["Positive slope", "Zero slope", "Undefined slope"], guide: "Falls = Negative."
            })},
            { type: "PerfectRoot8", anchor: "A-N.1.1", openEnded: false, gen: () => {
                const n = rand(2, 40); const sq = n * n;
                return { q: `√${sq} = ?`, ans: n.toString(), distractors: [(n + 1).toString(), (sq / 2).toString(), "1"], guide: `${n} × ${n} = ${sq}.` };
            }},
            { type: "SciNotationConvert", anchor: "Convert to scientific notation.", openEnded: false, gen: () => {
                const sig = rand(1, 9); const zeros = rand(3, 10); const num = sig * Math.pow(10, zeros);
                return { q: `Write ${num.toLocaleString()} in scientific notation.`, ans: `${sig} × 10^${zeros}`, distractors: [`${sig} × 10^${zeros - 1}`, `${sig * 10} × 10^${zeros - 1}`, `${sig} × 10^${zeros + 1}`], guide: `Move the decimal ${zeros} places left: ${sig} × 10^${zeros}.` };
            }},
            { type: "SciNotationToStandard", anchor: "Convert scientific notation to standard.", openEnded: false, gen: () => {
                const sig = rand(1, 9); const exp = rand(3, 8);
                const standard = sig * Math.pow(10, exp);
                return { q: `Write ${sig} × 10^${exp} in standard form.`, ans: standard.toLocaleString(), distractors: [(sig * Math.pow(10, exp - 1)).toLocaleString(), (sig * Math.pow(10, exp + 1)).toLocaleString(), `${sig}${'0'.repeat(exp - 1)}`], guide: `Move the decimal ${exp} places right: ${sig} × 10^${exp} = ${standard.toLocaleString()}.` };
            }},
            { type: "SciNotationMultiply", anchor: "Multiply numbers in scientific notation.", openEnded: false, gen: () => {
                const a = rand(2, 9); const e1 = rand(2, 6); const b = rand(2, 9); const e2 = rand(2, 6);
                const prod = a * b; const expSum = e1 + e2;
                const finalSig = prod >= 10 ? (prod / 10) : prod;
                const finalExp = prod >= 10 ? expSum + 1 : expSum;
                return { q: `(${a} × 10^${e1}) × (${b} × 10^${e2}) = ?`, ans: `${finalSig} × 10^${finalExp}`, distractors: [`${prod} × 10^${expSum}`, `${a + b} × 10^${expSum}`, `${finalSig} × 10^${finalExp - 1}`], guide: `Multiply coefficients: ${a} × ${b} = ${prod}. Add exponents: ${e1} + ${e2} = ${expSum}. ${prod >= 10 ? `Adjust: ${prod} = ${finalSig} × 10, so ${finalSig} × 10^${finalExp}.` : `Result: ${finalSig} × 10^${finalExp}.`}` };
            }},
            { type: "ExponentProductRule", anchor: "x^a × x^b = x^(a+b).", openEnded: false, gen: () => {
                const base = rand(2, 10); const a = rand(2, 8); const b = rand(2, 8);
                return { q: `Simplify: ${base}^${a} × ${base}^${b}`, ans: `${base}^${a + b}`, distractors: [`${base}^${a * b}`, `${base * 2}^${a + b}`, `${base}^${Math.abs(a - b)}`], guide: `When multiplying same bases, add exponents: ${base}^${a} × ${base}^${b} = ${base}^(${a}+${b}) = ${base}^${a + b}.` };
            }},
            { type: "ExponentQuotientRule", anchor: "x^a ÷ x^b = x^(a-b).", openEnded: false, gen: () => {
                const base = rand(2, 10); const a = rand(5, 12); const b = rand(1, a - 1);
                return { q: `Simplify: ${base}^${a} ÷ ${base}^${b}`, ans: `${base}^${a - b}`, distractors: [`${base}^${a + b}`, `${base}^${a * b}`, `${base}^${b}`], guide: `When dividing same bases, subtract exponents: ${base}^${a} ÷ ${base}^${b} = ${base}^(${a}−${b}) = ${base}^${a - b}.` };
            }},
            { type: "ExponentPowerRule", anchor: "(x^a)^b = x^(ab).", openEnded: false, gen: () => {
                const base = rand(2, 7); const a = rand(2, 6); const b = rand(2, 5);
                return { q: `Simplify: (${base}^${a})^${b}`, ans: `${base}^${a * b}`, distractors: [`${base}^${a + b}`, `${base * b}^${a}`, `${base}^${a}`], guide: `Power of a power: multiply exponents. (${base}^${a})^${b} = ${base}^(${a}×${b}) = ${base}^${a * b}.` };
            }},
            { type: "NegativeExponents", anchor: "Simplify x^-n = 1/x^n.", openEnded: false, gen: () => {
                const base = rand(2, 10); const n = rand(1, 5); const val = Math.pow(base, n);
                return { q: `Simplify: ${base}^(-${n})`, ans: `1/${val}`, distractors: [`-${val}`, `${val}`, `-1/${val}`], guide: `A negative exponent means reciprocal: ${base}^(-${n}) = 1/${base}^${n} = 1/${val}.` };
            }},
            { type: "SquareRootCalc", anchor: "Find √(perfect square).", openEnded: false, gen: () => {
                const n = rand(2, 25); const sq = n * n;
                return { q: `√${sq} = ?`, ans: n.toString(), distractors: [(n + 1).toString(), (n - 1).toString(), (sq / 2).toString()], guide: `${n} × ${n} = ${sq}, so √${sq} = ${n}.` };
            }},
            { type: "CubeRootCalc", anchor: "Find ∛(perfect cube).", openEnded: false, gen: () => {
                const n = rand(1, 10); const cube = n * n * n;
                return { q: `∛${cube} = ?`, ans: n.toString(), distractors: [(n + 1).toString(), (n - 1).toString(), (n * n).toString()], guide: `${n} × ${n} × ${n} = ${cube}, so ∛${cube} = ${n}.` };
            }},
            { type: "IrrationalApprox", anchor: "√N is between which two integers.", openEnded: false, gen: () => {
                const low = rand(2, 15); const high = low + 1; const n = rand(low * low + 1, high * high - 1);
                return { q: `√${n} is between which two consecutive integers?`, ans: `${low} and ${high}`, distractors: [`${low - 1} and ${low}`, `${high} and ${high + 1}`, `${low} and ${low}`], guide: `${low}² = ${low * low} and ${high}² = ${high * high}. Since ${low * low} < ${n} < ${high * high}, √${n} is between ${low} and ${high}.` };
            }},
            { type: "PythagoreanCalc", anchor: "Find hypotenuse or leg.", openEnded: false, gen: () => {
                const trips = [[3,4,5],[5,12,13],[6,8,10],[7,24,25],[8,15,17],[9,12,15],[9,40,41],[10,24,26],[12,16,20],[15,20,25]];
                const t = choose(trips); const k = rand(1, 4);
                const a = t[0] * k; const b = t[1] * k; const c = t[2] * k;
                const findHyp = choose([true, false]);
                if (findHyp) {
                    return { q: `A right triangle has legs ${a} and ${b}. Find the hypotenuse.`, ans: c.toString(), distractors: [(a + b).toString(), (c + 1).toString(), Math.round(Math.sqrt(a + b)).toString()], guide: `c² = a² + b² = ${a}² + ${b}² = ${a*a} + ${b*b} = ${c*c}. c = √${c*c} = ${c}.` };
                } else {
                    return { q: `A right triangle has hypotenuse ${c} and one leg ${a}. Find the other leg.`, ans: b.toString(), distractors: [(c - a).toString(), (b + 1).toString(), (a + c).toString()], guide: `b² = c² − a² = ${c}² − ${a}² = ${c*c} − ${a*a} = ${b*b}. b = √${b*b} = ${b}.` };
                }
            }},
            { type: "PythagoreanConverse", anchor: "Do sides form a right triangle?", openEnded: false, gen: () => {
                const trips = [[3,4,5],[5,12,13],[6,8,10],[7,24,25],[8,15,17]];
                const isRight = choose([true, false]);
                const t = choose(trips); const k = rand(1, 3);
                const a = t[0] * k; const b = t[1] * k; const c = isRight ? t[2] * k : t[2] * k + rand(1, 3);
                return { q: `Do sides ${a}, ${b}, ${c} form a right triangle?`, ans: isRight ? "Yes" : "No", distractors: [isRight ? "No" : "Yes", "Not enough info", "Only if scaled"], guide: `Check: ${a}² + ${b}² = ${a*a} + ${b*b} = ${a*a + b*b}. ${c}² = ${c*c}. ${a*a + b*b === c*c ? 'Equal, so yes.' : 'Not equal, so no.'}` };
            }},
            { type: "SlopeFromTwoPoints", anchor: "(y2−y1)/(x2−x1).", openEnded: false, gen: () => {
                const x1 = rand(-8, 8); const y1 = rand(-8, 8); const x2 = rand(-8, 8); const y2 = rand(-8, 8);
                const dx = x2 - x1 === 0 ? 1 : x2 - x1; const dy = y2 - y1;
                const x2f = x1 + dx;
                const g = gcd(Math.abs(dy), Math.abs(dx));
                const sn = dy / g; const sd = dx / g;
                const neg = sd < 0 ? -1 : 1;
                const ansStr = (sd * neg) === 1 ? (sn * neg).toString() : `${sn * neg}/${sd * neg}`;
                return { q: `Find the slope of the line through (${x1}, ${y1}) and (${x2f}, ${y1 + dy}).`, ans: ansStr, distractors: [`${-sn * neg}/${sd * neg === 1 ? 1 : sd * neg}`, `${sd * neg}/${sn === 0 ? 1 : sn * neg}`, `${dy + 1}/${dx}`], guide: `Slope = (y2 − y1)/(x2 − x1) = (${y1 + dy} − ${y1})/(${x2f} − ${x1}) = ${dy}/${dx}. Simplified: ${ansStr}.` };
            }},
            { type: "SlopeInterceptForm", anchor: "Write y = mx + b.", openEnded: false, gen: () => {
                const m = rand(-8, 8); const b = rand(-10, 10);
                return { q: `Write the equation of a line with slope ${m} and y-intercept ${b}.`, ans: `y = ${m}x + ${b}`, distractors: [`y = ${b}x + ${m}`, `y = ${-m}x + ${b}`, `y = ${m}x − ${b}`], guide: `Slope-intercept form is y = mx + b. Plug in m = ${m} and b = ${b}: y = ${m}x + ${b}.` };
            }},
            { type: "PointSlopeConvert", anchor: "Convert point-slope to slope-intercept.", openEnded: false, gen: () => {
                const m = rand(-5, 5); const x1 = rand(-5, 5); const y1 = rand(-5, 5);
                const b = y1 - m * x1;
                return { q: `Convert to slope-intercept form: y − ${y1} = ${m}(x − ${x1})`, ans: `y = ${m}x + ${b}`, distractors: [`y = ${m}x − ${b}`, `y = ${-m}x + ${b}`, `y = ${m}x + ${y1}`], guide: `Distribute: y − ${y1} = ${m}x − ${m * x1}. Add ${y1}: y = ${m}x + (${-m * x1} + ${y1}) = ${m}x + ${b}.` };
            }},
            { type: "XYIntercepts", anchor: "Find x and y intercepts.", openEnded: false, gen: () => {
                const a = rand(1, 8); const b = rand(1, 8); const c = a * b;
                return { q: `Find the x-intercept of ${a}x + ${b}y = ${c}.`, ans: `(${b}, 0)`, distractors: [`(0, ${a})`, `(${c}, 0)`, `(${a}, ${b})`], guide: `Set y = 0: ${a}x = ${c}, so x = ${c}/${a} = ${b}. The x-intercept is (${b}, 0).` };
            }},
            { type: "ParallelSlopes", anchor: "Same slope = parallel.", openEnded: false, gen: () => {
                const m = rand(-7, 7); const b1 = rand(-10, 10); const b2 = rand(-10, 10);
                return { q: `Line 1: y = ${m}x + ${b1}. Which line is parallel?`, ans: `y = ${m}x + ${b2}`, distractors: [`y = ${-m}x + ${b2}`, `y = ${m + 1}x + ${b1}`, `y = ${m === 0 ? 1 : -1/m}x + ${b2}`], guide: `Parallel lines have equal slopes. Line 1 has slope ${m}, so a parallel line also has slope ${m}: y = ${m}x + ${b2}.` };
            }},
            { type: "PerpendicularSlopes", anchor: "Negative reciprocal slopes.", openEnded: false, gen: () => {
                const n = rand(1, 7); const d = rand(1, 7); const b1 = rand(-10, 10);
                const perpN = -d; const perpD = n;
                const g = gcd(Math.abs(perpN), perpD); const sn = perpN / g; const sd = perpD / g;
                const mStr = d === 1 ? `${n}` : `${n}/${d}`;
                const perpStr = sd === 1 ? `${sn}` : `${sn}/${sd}`;
                return { q: `A line has slope ${mStr}. What is the slope of a perpendicular line?`, ans: perpStr, distractors: [mStr, `${n}/${d}`, `${d}/${n}`], guide: `Perpendicular slope is the negative reciprocal. Flip ${mStr} and negate: ${perpStr}.` };
            }},
            { type: "SystemSubstitutionCalc", anchor: "Solve system by substitution.", openEnded: false, gen: () => {
                const x = rand(-5, 5); const y = rand(-5, 5);
                const a = rand(1, 5); const b = rand(-5, 5);
                const c = a * x + b;
                const d = rand(1, 4); const e = rand(1, 4); const f = d * x + e * y;
                return { q: `Solve by substitution: y = ${a}x + ${b} and ${d}x + ${e}y = ${f}`, ans: `(${x}, ${y})`, distractors: [`(${y}, ${x})`, `(${x + 1}, ${y - 1})`, `(${-x}, ${-y})`], guide: `Substitute y = ${a}x + ${b} into ${d}x + ${e}y = ${f}: ${d}x + ${e}(${a}x + ${b}) = ${f}. Solve: ${d}x + ${e * a}x + ${e * b} = ${f}, ${d + e * a}x = ${f - e * b}, x = ${x}. Then y = ${a}(${x}) + ${b} = ${y}.` };
            }},
            { type: "SystemEliminationCalc", anchor: "Solve system by elimination.", openEnded: false, gen: () => {
                const x = rand(-5, 5); const y = rand(-5, 5);
                const a1 = rand(1, 5); const b1 = rand(1, 5); const c1 = a1 * x + b1 * y;
                const a2 = rand(1, 5); const b2 = -b1; const c2 = a2 * x + b2 * y;
                return { q: `Solve by elimination: ${a1}x + ${b1}y = ${c1} and ${a2}x + ${b2 >= 0 ? b2 : '(' + b2 + ')'}y = ${c2}`, ans: `(${x}, ${y})`, distractors: [`(${y}, ${x})`, `(${x + 1}, ${y + 1})`, `(${-x}, ${y})`], guide: `Add the equations: ${a1 + a2}x + ${b1 + b2}y = ${c1 + c2}. Since b-terms cancel: ${a1 + a2}x = ${c1 + c2}, x = ${x}. Substitute back: ${a1}(${x}) + ${b1}y = ${c1}, y = ${y}.` };
            }},
            { type: "FunctionEvalCalc", anchor: "f(x) = expression, find f(value).", openEnded: false, gen: () => {
                const a = rand(1, 8); const b = rand(-10, 10); const xVal = rand(-5, 5);
                const result = a * xVal + b;
                return { q: `If f(x) = ${a}x + ${b >= 0 ? b : '(' + b + ')'}, find f(${xVal}).`, ans: result.toString(), distractors: [(result + a).toString(), (result - b).toString(), (a * xVal).toString()], guide: `f(${xVal}) = ${a}(${xVal}) + ${b} = ${a * xVal} + ${b} = ${result}.` };
            }},
            { type: "FunctionTableRule", anchor: "Find the rule from input/output table.", openEnded: false, gen: () => {
                const m = rand(1, 8); const b = rand(-5, 5);
                const x1 = rand(0, 4); const x2 = x1 + 1; const x3 = x1 + 2;
                const y1 = m * x1 + b; const y2 = m * x2 + b; const y3 = m * x3 + b;
                return { q: `Input: ${x1}, ${x2}, ${x3}. Output: ${y1}, ${y2}, ${y3}. Find the rule.`, ans: `y = ${m}x + ${b}`, distractors: [`y = ${m + 1}x + ${b}`, `y = ${m}x + ${b + 1}`, `y = ${b}x + ${m}`], guide: `Rate of change = (${y2} − ${y1}) / (${x2} − ${x1}) = ${m}. At x = ${x1}, y = ${y1}, so b = ${y1} − ${m}(${x1}) = ${b}. Rule: y = ${m}x + ${b}.` };
            }},
            { type: "TranslateCoord", anchor: "(x,y) → (x+a, y+b).", openEnded: false, gen: () => {
                const x = rand(-8, 8); const y = rand(-8, 8); const a = rand(-6, 6); const b = rand(-6, 6);
                return { q: `Translate (${x}, ${y}) by (${a}, ${b}).`, ans: `(${x + a}, ${y + b})`, distractors: [`(${x - a}, ${y - b})`, `(${x + b}, ${y + a})`, `(${x * a}, ${y * b})`], guide: `Add the translation: (${x} + ${a}, ${y} + ${b}) = (${x + a}, ${y + b}).` };
            }},
            { type: "ReflectCoord", anchor: "Reflect over x-axis or y-axis.", openEnded: false, gen: () => {
                const x = rand(-10, 10); const y = rand(-10, 10);
                const axis = choose(["x-axis", "y-axis"]);
                const rx = axis === "y-axis" ? -x : x; const ry = axis === "x-axis" ? -y : y;
                return { q: `Reflect (${x}, ${y}) over the ${axis}.`, ans: `(${rx}, ${ry})`, distractors: [`(${-rx}, ${ry})`, `(${rx}, ${-ry})`, `(${-x}, ${-y})`], guide: `Reflecting over the ${axis}: ${axis === "x-axis" ? "negate y" : "negate x"}. (${x}, ${y}) → (${rx}, ${ry}).` };
            }},
            { type: "DilateCoord", anchor: "Dilate (x,y) by scale factor k.", openEnded: false, gen: () => {
                const x = rand(-8, 8); const y = rand(-8, 8); const k = rand(2, 6);
                return { q: `Dilate (${x}, ${y}) by scale factor ${k} from the origin.`, ans: `(${x * k}, ${y * k})`, distractors: [`(${x + k}, ${y + k})`, `(${x * k}, ${y})`, `(${x}, ${y * k})`], guide: `Multiply both coordinates by ${k}: (${x} × ${k}, ${y} × ${k}) = (${x * k}, ${y * k}).` };
            }},
            { type: "VolumeComposite", anchor: "Volume of cylinder, cone, or sphere.", openEnded: false, gen: () => {
                const shape = choose(["cylinder", "cone", "sphere"]);
                const r = rand(1, 12); const h = rand(2, 15);
                let vol, formula, ansStr;
                if (shape === "cylinder") {
                    vol = (Math.PI * r * r * h).toFixed(1);
                    formula = `V = πr²h = π × ${r}² × ${h} = π × ${r * r} × ${h}`;
                    ansStr = vol;
                } else if (shape === "cone") {
                    vol = (Math.PI * r * r * h / 3).toFixed(1);
                    formula = `V = (1/3)πr²h = (1/3) × π × ${r}² × ${h} = (1/3) × π × ${r * r} × ${h}`;
                    ansStr = vol;
                } else {
                    vol = (4 / 3 * Math.PI * r * r * r).toFixed(1);
                    formula = `V = (4/3)πr³ = (4/3) × π × ${r}³ = (4/3) × π × ${r * r * r}`;
                    ansStr = vol;
                }
                const d1 = (parseFloat(ansStr) * 2).toFixed(1); const d2 = (parseFloat(ansStr) / 2).toFixed(1); const d3 = (parseFloat(ansStr) + r * 10).toFixed(1);
                return { q: `Find the volume of a ${shape}${shape !== "sphere" ? ` with radius ${r} and height ${h}` : ` with radius ${r}`}. Round to one decimal.`, ans: ansStr, distractors: [d2, d3, d1], guide: `${formula} = ${ansStr}.` };
            }}
        ]
    },
    keystone: {
        algebra1: [

            // ===== MODULE 1: OPERATIONS & LINEAR EQUATIONS (16) =====

            { type: "RealNumberComparison", anchor: "A1.1.1.1.1", openEnded: false, gen: () => {
                const v = rand(2, 25); const inner = v * v + rand(1, 20);
                return {
                    q: `Which irrational number is between ${v} and ${v + 1}?`,
                    ans: `√${inner}`,
                    distractors: [`√${v}`, `√${(v + 1) * (v + 1)}`, `${v}.5`],
                    guide: `${v}² = ${v * v} and ${v + 1}² = ${(v + 1) * (v + 1)}. Since ${inner} is between ${v * v} and ${(v + 1) * (v + 1)}, its square root is between ${v} and ${v + 1}.`
                };
            }},

            { type: "SimplifyRadicals", anchor: "A1.1.1.1.2", openEnded: false, gen: () => {
                const coeff = rand(2, 25); const prime = [2, 3, 5, 7, 11, 13, 17, 19][rand(0, 7)];
                const inside = (coeff * coeff) * prime;
                return {
                    q: `Simplify the expression √${inside} completely.`,
                    ans: `${coeff}√${prime}`,
                    distractors: [`${prime}√${coeff}`, `${coeff * prime}√2`, `√${inside}`],
                    guide: `Factor out the perfect square: √(${coeff * coeff} × ${prime}) = √${coeff * coeff} × √${prime} = ${coeff}√${prime}.`
                };
            }},

            { type: "EstimationWordProblem", anchor: "A1.1.1.4.1", openEnded: false, gen: () => {
                const p1 = (rand(100, 800)) / 10; const p2 = (rand(15, 200)) / 10;
                const ans = Math.round(p1) * Math.round(p2);
                return {
                    q: `A technician charges $${p1.toFixed(2)} per hour. If they work ${p2.toFixed(1)} hours, what is the best estimate for the total cost?`,
                    ans: `$${ans}`,
                    distractors: [`$${ans - 20}`, `$${ans + 20}`, `$${Math.round(p1 * p2) + 50}`],
                    guide: `Round ${p1.toFixed(2)} to ${Math.round(p1)} and ${p2.toFixed(1)} to ${Math.round(p2)}. Multiply: ${Math.round(p1)} × ${Math.round(p2)} = ${ans}.`
                };
            }},

            { type: "PolynomialMultiplication", anchor: "A1.1.1.5.1", openEnded: false, gen: () => {
                const a = rand(2, 20); const b = rand(2, 25);
                const mid = b - a * b;
                const midStr = mid >= 0 ? `+ ${mid}` : `- ${Math.abs(mid)}`;
                return {
                    q: `Multiply and simplify: (${a}x + ${b})(x - ${b})`,
                    ans: `${a}x² ${midStr}x - ${b * b}`,
                    distractors: [`${a}x² - ${b * b}`, `${a}x² + ${b + (a * b)}x + ${b * b}`, `${a}x - ${b * b}`],
                    guide: `Use FOIL: (${a}x)(x) + (${a}x)(-${b}) + (${b})(x) + (${b})(-${b}) = ${a}x² - ${a * b}x + ${b}x - ${b * b} = ${a}x² ${midStr}x - ${b * b}.`
                };
            }},

            { type: "FactoringTrinomials", anchor: "A1.1.1.5.2", openEnded: false, gen: () => {
                const r1 = rand(1, 15); const r2 = rand(r1 + 1, 25);
                const b = r1 + r2; const c = r1 * r2;
                return {
                    q: `Factor completely: x² - ${b}x + ${c}`,
                    ans: `(x - ${r1})(x - ${r2})`,
                    distractors: [`(x + ${r1})(x + ${r2})`, `(x - ${r1})(x + ${r2})`, `x(x - ${b})`],
                    guide: `Find two numbers that multiply to ${c} and add to -${b}. Those are -${r1} and -${r2}.`
                };
            }},

            { type: "RationalExpressions", anchor: "A1.1.1.5.3", openEnded: false, gen: () => {
                const a = rand(2, 30);
                return {
                    q: `Simplify the expression: (${a}x² + ${a}x) / ${a}x`,
                    ans: `x + 1`,
                    distractors: [`${a}x`, `x² + 1`, `x`],
                    guide: `Factor the numerator: ${a}x(x + 1). Divide by ${a}x to leave x + 1.`
                };
            }},

            { type: "LiteralEquations", anchor: "A1.1.2.1.1", openEnded: false, gen: () => ({
                q: `Solve for h in the volume formula: V = πr²h`,
                ans: `h = V / (πr²)`,
                distractors: [`h = Vπr²`, `h = πr² / V`, `h = V - πr²`],
                guide: `To isolate h, divide both sides of the equation by (πr²).`
            })},

            { type: "MultiStepLinear", anchor: "A1.1.2.1.2", openEnded: false, gen: () => {
                const x = rand(2, 30); const a = rand(2, 15); const halfB = rand(3, 40);
                const b = halfB * 2;
                const res = a * x + b;
                return {
                    q: `Solve for x: ${a}(x + ${halfB}) = ${res + (a * halfB)}`,
                    ans: x.toString(),
                    distractors: [(x + 2).toString(), (x - 2).toString(), (x + 10).toString()],
                    guide: `Distribute first: ${a}x + ${a * halfB}. Subtract ${a * halfB} from both sides, then divide by ${a}.`
                };
            }},

            { type: "SystemsBySubstitution", anchor: "A1.1.2.2.1", openEnded: false, gen: () => {
                const x = rand(1, 20); const y = rand(3, 35);
                const a1 = rand(2, 12); const c1 = a1 * x + y;
                return {
                    q: `Solve the system: ${a1}x + y = ${c1} and y = x + ${y - x}`,
                    ans: `(${x}, ${y})`,
                    distractors: [`(${y}, ${x})`, `(0, ${c1})`, `No Solution`],
                    guide: `Substitute y = x + ${y - x} into the first equation: ${a1}x + (x + ${y - x}) = ${c1}. Combine: ${a1 + 1}x + ${y - x} = ${c1}. Solve for x = ${x}, then y = ${y}.`
                };
            }},

            { type: "SystemsWordProblem", anchor: "A1.1.2.2.2", openEnded: false, gen: () => {
                const pens = rand(2, 18); const notebooks = rand(2, 18);
                const itemTotal = pens + notebooks;
                const penPrice = rand(1, 10); const notebookPrice = rand(4, 20);
                const total = penPrice * pens + notebookPrice * notebooks;
                return {
                    q: `A store sells pens for $${penPrice} and notebooks for $${notebookPrice}. You buy ${itemTotal} items total for $${total}. How many notebooks?`,
                    ans: notebooks.toString(),
                    distractors: [pens.toString(), itemTotal.toString(), (notebooks + 1).toString()],
                    guide: `Set up: x + y = ${itemTotal} and ${penPrice}x + ${notebookPrice}y = ${total}. Solve: x = ${pens} pens, y = ${notebooks} notebooks.`
                };
            }},

            { type: "AbsoluteValueEq", anchor: "A1.1.3.1.1", openEnded: false, gen: () => {
                const v = rand(5, 80);
                return {
                    q: `Solve: |x - 5| = ${v}`,
                    ans: `${v + 5} and ${5 - v}`,
                    distractors: [`${v + 5}`, `${v}`, `0`],
                    guide: `Split into x - 5 = ${v} and x - 5 = -${v}. Solve both: x = ${v + 5} and x = ${5 - v}.`
                };
            }},

            { type: "InequalityWordProblem", anchor: "A1.1.3.1.2", openEnded: false, gen: () => {
                const limit = rand(100, 2000); const fee = rand(10, 300);
                return {
                    q: `You have at most $${limit}. You spend $${fee} on a ticket and $x on food. Which inequality fits?`,
                    ans: `x + ${fee} ≤ ${limit}`,
                    distractors: [`x + ${fee} ≥ ${limit}`, `x - ${fee} ≤ ${limit}`, `${fee}x ≤ ${limit}`],
                    guide: `"At most" means less than or equal to (≤). Sum of costs must be ≤ ${limit}.`
                };
            }},

            { type: "CompoundInequality", anchor: "A1.1.3.1.3", openEnded: false, gen: () => {
                const a = rand(2, 15); const lo = -1 * rand(2, 25) * a; const hi = rand(3, 30) * a;
                return {
                    q: `Solve: ${lo} < ${a}x < ${hi}`,
                    ans: `${lo / a} < x < ${hi / a}`,
                    distractors: [`x < ${hi / a}`, `${lo} < x < ${hi}`, `${hi / a} < x < ${lo / a}`],
                    guide: `Divide all three parts by ${a} to isolate x: ${lo}/${a} < x < ${hi}/${a}.`
                };
            }},

            { type: "SystemOfInequalities", anchor: "A1.1.3.2.1", openEnded: false, gen: () => ({
                q: `In a system of inequalities, if the point (0,0) makes both inequalities true, the solution region is:`,
                ans: "The overlapping shaded area containing the origin",
                distractors: ["Only the first line", "The unshaded area", "The y-axis"],
                guide: `The solution to a system of inequalities is where the individual solutions overlap.`
            })},

            { type: "SignFlipInequality", anchor: "A1.1.3.1.1", openEnded: false, gen: () => {
                const posVal = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20][rand(0, 9)]; const val = -1 * posVal;
                const result = 20 / val;
                return {
                    q: `When solving ${val}x < 20, the solution is:`,
                    ans: `x > ${result}`,
                    distractors: [`x < ${result}`, `x = ${result}`, `x > ${20 + val}`],
                    guide: `Divide both sides by ${val}. Since you are dividing by a negative number, flip the inequality sign: x > ${result}.`
                };
            }},

            { type: "GCFWithVariables", anchor: "A1.1.1.2.1", openEnded: false, gen: () => ({
                q: `Find the GCF of 4x³y and 6x²y²`,
                ans: "2x²y",
                distractors: ["12x³y²", "2xy", "x²y"],
                guide: `GCF of 4 and 6 is 2. Take the lowest exponent for each variable: x² and y. GCF = 2x²y.`
            })},

            // ===== MODULE 2: FUNCTIONS & DATA (16) =====

            { type: "FunctionIDPairs", anchor: "A1.2.1.1.1", openEnded: false, gen: () => ({
                q: `Which set of ordered pairs is a function?`,
                ans: "{(1,2), (2,2), (3,2)}",
                distractors: ["{(1,2), (1,3), (1,4)}", "{(2,1), (2,5), (3,2)}", "{(0,1), (0,0)}"],
                guide: `A function cannot have repeating X values with different Y values. Repeating Y values is okay.`
            })},

            { type: "FunctionIDGraph", anchor: "A1.2.1.1.1", openEnded: false, gen: () => ({
                q: `To determine if a graph is a function, we use the:`,
                ans: "Vertical Line Test",
                distractors: ["Horizontal Line Test", "Origin Test", "Slope Test"],
                guide: `If a vertical line touches the graph in more than one spot, it is not a function.`
            })},

            { type: "DomainEvaluation", anchor: "A1.2.1.1.3", openEnded: false, gen: () => {
                const s = rand(1, 40);
                return {
                    q: `What is the domain of {(0,${s}), (5,${s + 1}), (10,${s + 2})}?`,
                    ans: "{0, 5, 10}",
                    distractors: [`{${s}, ${s + 1}, ${s + 2}}`, "{0, 10}", "All real numbers"],
                    guide: `The domain is the set of all X-values (the first number in each pair).`
                };
            }},

            { type: "RangeEvaluation", anchor: "A1.2.1.1.3", openEnded: false, gen: () => {
                const s = rand(1, 40);
                return {
                    q: `What is the range of {(1,${s}), (2,${s}), (3,${s})}?`,
                    ans: `{${s}}`,
                    distractors: ["{1, 2, 3}", "{0}", "All real numbers"],
                    guide: `The range is the set of all Y-values. Here, the only Y-value is ${s}.`
                };
            }},

            { type: "FunctionNotation", anchor: "A1.2.1.2.1", openEnded: false, gen: () => {
                const m = rand(2, 20); const b = rand(1, 30); const x = rand(2, 20);
                return {
                    q: `If f(x) = ${m}x - ${b}, find f(${x}).`,
                    ans: (m * x - b).toString(),
                    distractors: [(m * x).toString(), (x - b).toString(), (m + x + b).toString()],
                    guide: `Substitute ${x} for x: f(${x}) = ${m}(${x}) - ${b} = ${m * x} - ${b} = ${m * x - b}.`
                };
            }},

            { type: "SlopeFromPoints", anchor: "A1.2.2.1.1", openEnded: false, gen: () => {
                const rise = rand(2, 40) * 2; const y1 = rand(1, 30); const y2 = y1 + rise;
                const slope = rise / 2;
                return {
                    q: `Find the slope between (0, ${y1}) and (2, ${y2}).`,
                    ans: slope.toString(),
                    distractors: ["2", rise.toString(), "0.5"],
                    guide: `Slope = (y2 - y1) / (x2 - x1) = (${y2} - ${y1}) / (2 - 0) = ${rise} / 2 = ${slope}.`
                };
            }},

            { type: "SlopeWordProblem", anchor: "A1.2.2.1.1", openEnded: false, gen: () => {
                const rate = rand(10, 200);
                return {
                    q: `A plumber charges a flat fee plus $${rate} per hour. The $${rate} represents the:`,
                    ans: "Slope",
                    distractors: ["Y-intercept", "X-intercept", "Domain"],
                    guide: `The "per hour" rate is the rate of change, which is the slope in a linear equation.`
                };
            }},

            { type: "YInterceptLogic", anchor: "A1.2.2.1.3", openEnded: false, gen: () => {
                const fee = rand(15, 400);
                return {
                    q: `A gym charges a $${fee} sign-up fee plus monthly dues. The $${fee} represents the:`,
                    ans: "Y-intercept",
                    distractors: ["Slope", "Range", "X-intercept"],
                    guide: `The flat fee is the starting value (when time = 0), which is the y-intercept.`
                };
            }},

            { type: "ParallelLines", anchor: "A1.2.2.1", openEnded: false, gen: () => {
                const m = rand(2, 30);
                return {
                    q: `What is the slope of a line parallel to y = ${m}x + 10?`,
                    ans: m.toString(),
                    distractors: [`-${m}`, `1/${m}`, "10"],
                    guide: `Parallel lines always have the exact same slope. The slope of y = ${m}x + 10 is ${m}.`
                };
            }},

            { type: "PerpendicularLines", anchor: "A1.2.2.1", openEnded: false, gen: () => {
                const m = rand(2, 25);
                return {
                    q: `What is the slope of a line perpendicular to y = ${m}x - 4?`,
                    ans: `-1/${m}`,
                    distractors: [m.toString(), `-${m}`, `1/${m}`],
                    guide: `Perpendicular slopes are negative reciprocals: flip the fraction and change the sign. The negative reciprocal of ${m} is -1/${m}.`
                };
            }},

            { type: "BoxPlotRange", anchor: "A1.2.3.1.1", openEnded: false, gen: () => {
                const min = rand(10, 80); const max = rand(85, 200);
                return {
                    q: `In a box plot, the whiskers end at ${min} and ${max}. What is the range?`,
                    ans: (max - min).toString(),
                    distractors: [max.toString(), min.toString(), "50"],
                    guide: `Range = Maximum - Minimum = ${max} - ${min} = ${max - min}.`
                };
            }},

            { type: "InterquartileRange", anchor: "A1.2.3.1.1", openEnded: false, gen: () => {
                const q1 = rand(20, 120); const q3 = q1 + rand(10, 80);
                const iqr = q3 - q1;
                return {
                    q: `If Q1 is ${q1} and Q3 is ${q3}, what is the Interquartile Range (IQR)?`,
                    ans: iqr.toString(),
                    distractors: [(q1 + q3).toString(), q1.toString(), q3.toString()],
                    guide: `IQR = Q3 - Q1 = ${q3} - ${q1} = ${iqr}.`
                };
            }},

            { type: "StemAndLeaf", anchor: "A1.2.3.1.1", openEnded: false, gen: () => {
                const stem = rand(1, 30); const leaf = rand(0, 9);
                const value = stem * 10 + leaf;
                return {
                    q: `In a stem-and-leaf plot, what does ${stem} | ${leaf} represent if the key is ${stem} | ${leaf} = ${value}?`,
                    ans: value.toString(),
                    distractors: [`${stem}.${leaf}`, (stem + leaf).toString(), (stem * leaf).toString()],
                    guide: `The stem is the tens place and the leaf is the ones place: ${stem} | ${leaf} = ${value}.`
                };
            }},

            { type: "LineOfBestFit", anchor: "A1.2.3.2.1", openEnded: false, gen: () => ({
                q: `Scatter plot points go from bottom-left to top-right. This relationship is:`,
                ans: "Positive Correlation",
                distractors: ["Negative Correlation", "No Correlation", "Constant Correlation"],
                guide: `When both variables increase together, the correlation is positive.`
            })},

            { type: "CompoundProbability", anchor: "A1.2.3.3.1", openEnded: false, gen: () => {
                const sides = rand(4, 50);
                return {
                    q: `Probability of rolling a 1 on a ${sides}-sided die AND flipping Heads?`,
                    ans: `1/${sides * 2}`,
                    distractors: [`1/${sides}`, "1/2", `1/${sides + 2}`],
                    guide: `Multiply individual probabilities: (1/${sides}) × (1/2) = 1/${sides * 2}.`
                };
            }},

            { type: "LiteralEquationInterest", anchor: "A1.1.2.1.1", openEnded: false, gen: () => ({
                q: `Solve the interest formula I = Prt for r.`,
                ans: "r = I / (Pt)",
                distractors: ["r = IPt", "r = P / (It)", "r = I - Pt"],
                guide: `Divide both sides by (Pt) to isolate r: r = I / (Pt).`
            })},

            // ===== ORIGINAL CORE TEMPLATES =====

            { type: "RealNumberClassify", anchor: "A1.1.1.1.1", openEnded: false, gen: () => {
                const n = Math.sqrt(2);
                return {
                    q: `Is √2 rational or irrational?`,
                    ans: "irrational",
                    distractors: ["rational", "integer", "whole"],
                    guide: `Square roots of non-perfect squares are irrational.`
                };
            }},

            { type: "RadicalSimplify", anchor: "A1.1.1.1.2", openEnded: false, gen: () => {
                const b = rand(2,30);
                return {
                    q: `Simplify √${b*b*5}`,
                    ans: `${b}√5`,
                    distractors: [`√${b*b*5}`, `${b*2}√5`, `${b}√${b}`],
                    guide: `Factor perfect square.`
                };
            }},

            { type: "ExponentRules", anchor: "A1.1.1.2.1", openEnded: false, gen: () => {
                const a = rand(2,18);
                return {
                    q: `Simplify x^${a} · x^3`,
                    ans: `x^${a+3}`,
                    distractors: [`x^${a*3}`, `x^${a-3}`, `2x^${a}`],
                    guide: `Add exponents.`
                };
            }},

            { type: "PolynomialAdd", anchor: "A1.1.1.3.1", openEnded: false, gen: () => {
                const a = rand(2,50), b = rand(2,50);
                return {
                    q: `Simplify (${a}x + 4) + (${b}x + 3)`,
                    ans: `${a+b}x + 7`,
                    distractors: [`${a*b}x + 7`, `${a+b}x + 12`, `${a+b}x`],
                    guide: `Combine like terms.`
                };
            }},

            { type: "PolynomialMultiply", anchor: "A1.1.1.4.1", openEnded: false, gen: () => {
                const a = rand(2,35);
                return {
                    q: `Expand x(x + ${a})`,
                    ans: `x² + ${a}x`,
                    distractors: [`x² + ${a}`, `${a}x²`, `x + ${a}`],
                    guide: `Distribute x.`
                };
            }},

            { type: "FactorDifferenceSquares", anchor: "A1.1.1.5.1", openEnded: false, gen: () => {
                const a = rand(2,30);
                return {
                    q: `Factor x² - ${a*a}`,
                    ans: `(x - ${a})(x + ${a})`,
                    distractors: [`(x - ${a})²`, `(x + ${a})²`, `x(x-${a})`],
                    guide: `a² - b² = (a-b)(a+b).`
                };
            }},

            { type: "QuadraticSolve", anchor: "A1.1.2.1.2", openEnded: false, gen: () => {
                const r = rand(2,30);
                return {
                    q: `Solve x² = ${r*r}`,
                    ans: `${r}, -${r}`,
                    distractors: [`${r}`, `-${r}`, `0`],
                    guide: `Square root both sides.`
                };
            }},

            { type: "LinearEquation", anchor: "A1.1.2.1.1", openEnded: false, gen: () => {
                const x = rand(2,40), m = rand(2,20), b = rand(1,50);
                return {
                    q: `${m}x + ${b} = ${m*x+b}. Solve.`,
                    ans: x.toString(),
                    distractors: [(x+1).toString(), (x-1).toString(), b.toString()],
                    guide: `Isolate x.`
                };
            }},

            { type: "SystemSubstitution", anchor: "A1.1.2.2.1", openEnded: false, gen: () => {
                const x = rand(2,30), y = rand(2,30);
                return {
                    q: `x = ${x}, x + y = ${x+y}. Find y.`,
                    ans: y.toString(),
                    distractors: [x.toString(), (x+y).toString(), (y+1).toString()],
                    guide: `Substitute x.`
                };
            }},

            { type: "AbsoluteValueEqBasic", anchor: "A1.1.3.1.1", openEnded: false, gen: () => {
                const n = rand(2,60);
                return {
                    q: `Solve |x| = ${n}`,
                    ans: `${n}, -${n}`,
                    distractors: [`${n}`, `-${n}`, `0`],
                    guide: `Two solutions.`
                };
            }},

            { type: "InequalitySolve", anchor: "A1.1.3.1.2", openEnded: false, gen: () => {
                const n = rand(5,120);
                return {
                    q: `Solve x + 3 > ${n}`,
                    ans: `x > ${n-3}`,
                    distractors: [`x < ${n-3}`, `x > ${n}`, `x = ${n-3}`],
                    guide: `Subtract 3.`
                };
            }},

            { type: "SlopeFind", anchor: "A1.2.1.1.1", openEnded: false, gen: () => {
                const x1=rand(1,25), y1=rand(1,25), x2=x1+rand(1,25), y2=y1+rand(1,25);
                return {
                    q: `Find slope between (${x1},${y1}) and (${x2},${y2})`,
                    ans: `${y2-y1}/${x2-x1}`,
                    distractors: [`${x2-x1}/${y2-y1}`, `${y2-y1}`, `${x2-x1}`],
                    guide: `(y2-y1)/(x2-x1)`
                };
            }},

            { type: "SlopeIntercept", anchor: "A1.2.1.2.1", openEnded: false, gen: () => {
                const m = rand(2,30), b = rand(1,60);
                return {
                    q: `What is slope of y = ${m}x + ${b}?`,
                    ans: m.toString(),
                    distractors: [b.toString(), (m+b).toString(), "1"],
                    guide: `Slope = m.`
                };
            }},

            { type: "FunctionEvaluate", anchor: "A1.2.2.2.1", openEnded: false, gen: () => {
                const x=rand(2,30);
                return {
                    q: `If f(x)=2x+3, find f(${x})`,
                    ans: (2*x+3).toString(),
                    distractors: [(2*x).toString(), (x+3).toString(), (2*x+1).toString()],
                    guide: `Substitute x.`
                };
            }},

            { type: "FunctionDomain", anchor: "A1.2.2.1.1", openEnded: false, gen: () => {
                return {
                    q: `What is domain of real-world function?`,
                    ans: "all valid inputs",
                    distractors: ["outputs", "range", "graph"],
                    guide: `Domain = inputs.`
                };
            }},

            { type: "ScatterTrend", anchor: "A1.2.3.1.1", openEnded: false, gen: () => {
                return {
                    q: `If data rises left to right, what correlation?`,
                    ans: "positive",
                    distractors: ["negative", "none", "zero"],
                    guide: `Upward trend = positive.`
                };
            }},

            { type: "LineOfBestFitBasic", anchor: "A1.2.3.2.1", openEnded: false, gen: () => {
                return {
                    q: `Line of best fit is used to?`,
                    ans: "predict values",
                    distractors: ["find exact points", "remove data", "count points"],
                    guide: `Used for prediction.`
                };
            }}
        ]
    }
};

// GCD helper for fraction simplification
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
