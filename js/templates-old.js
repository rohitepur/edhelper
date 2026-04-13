const Templates = {
    3: [
        {
            type: "Long Word",
            anchor: "PSSA Multi-Step",
            openEnded: false,
            gen: () => {
                const start = rand(100, 150);
                const box1 = rand(25, 45);
                const box2 = rand(20, 40);
                const total = start + box1 + box2;
                const commonError1 = start + box1;
                const commonError2 = box1 + box2;
                const distractors = [commonError1.toString(), commonError2.toString(), (total + 10).toString()];

                const scenarios = [
                    {
                        q: `Mrs. Chen's classroom has ${start} crayons. On Monday, she receives a delivery with ${box1} crayons. On Wednesday, another delivery brings ${box2} crayons. How many total crayons does the classroom have now?`,
                        guide: `Start with ${start} crayons. Add the first delivery: ${start} + ${box1} = ${start + box1}. Add the second delivery: ${start + box1} + ${box2} = ${total}.`
                    },
                    {
                        q: `A library has ${start} picture books. The school donates ${box1} books to the library. Later, another school donates ${box2} books. How many picture books are now in the library?`,
                        guide: `Begin with ${start} books. Add first donation: ${start} + ${box1} = ${start + box1}. Add second donation: ${start + box1} + ${box2} = ${total}.`
                    },
                    {
                        q: `A farmer plants ${start} seeds on Monday. On Tuesday, she plants ${box1} more seeds. On Thursday, she plants ${box2} additional seeds. What is the total number of seeds planted?`,
                        guide: `First amount: ${start} seeds. Add second planting: ${start} + ${box1} = ${start + box1}. Add third planting: ${start + box1} + ${box2} = ${total}.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return { q: chosen.q, ans: total.toString(), distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Data Interpretation",
            openEnded: false,
            gen: () => {
                const fruits = [rand(3, 7), rand(4, 8), rand(2, 6)];
                const labels = ["Apples", "Oranges", "Bananas"];
                const ans = fruits[1];
                const distractors = [fruits[0].toString(), fruits[2].toString(), (ans + 1).toString()];

                return {
                    q: `The bar graph shows the number of each type of fruit sold at a farmers market. How many oranges were sold?`,
                    ans: ans.toString(),
                    distractors,
                    guide: `Look at the bar for Oranges. The height of the bar shows ${ans} oranges were sold.`,
                    render: (canvas, ctx) => {
                        drawCartesianGrid(ctx, 400, 250, 25);
                        ctx.fillStyle = '#212529';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText("Fruit Sold at Market", 120, 30);
                        ctx.font = '12px sans-serif';
                        const barWidth = 50;
                        const spacing = 100;
                        const colors = ['#FF6B6B', '#FFA500', '#FFD700'];
                        for (let i = 0; i < 3; i++) {
                            const h = fruits[i] * 20;
                            ctx.fillStyle = colors[i];
                            ctx.fillRect(60 + (i * spacing), 250 - h, barWidth, h);
                            ctx.fillStyle = '#212529';
                            ctx.fillText(labels[i], 50 + (i * spacing), 270);
                            ctx.fillText(fruits[i], 75 + (i * spacing), 250 - h - 5);
                        }
                        ctx.strokeStyle = '#999';
                        ctx.lineWidth = 1;
                        for (let i = 0; i <= 8; i++) {
                            ctx.beginPath();
                            ctx.moveTo(40, 250 - (i * 25));
                            ctx.lineTo(400, 250 - (i * 25));
                            ctx.stroke();
                            if (i > 0) ctx.fillText(i, 20, 250 - (i * 25) + 4);
                        }
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Multiplication",
            openEnded: true,
            gen: () => {
                const groups = rand(3, 8);
                const each = rand(4, 9);
                const total = groups * each;
                const scenarios = [
                    `There are ${groups} tables in the cafeteria. Each table seats ${each} students. How many students can sit if all tables are full?`,
                    `A gardener plants ${groups} rows of tomato plants. There are ${each} plants in each row. How many tomato plants are planted in total?`,
                    `The school buys ${groups} packages of pencils for the art room. Each package contains ${each} pencils. What is the total number of pencils?`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Enter the number only)</span>`;
                return {
                    q: qText,
                    ans: total.toString(),
                    guide: `Multiply the number of groups by the number in each group: ${groups} × ${each} = ${total}.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Addition/Subtraction",
            openEnded: true,
            gen: () => {
                const a = rand(20, 80);
                const b = rand(10, 50);
                const op = rand(0, 1);
                const result = op === 0 ? a + b : a - b;
                const expression = op === 0 ? `${a} + ${b}` : `${a} - ${b}`;
                return {
                    q: `Solve this problem:<br><br>${expression} = ?`,
                    ans: result.toString(),
                    guide: `${expression} = ${result}.`
                };
            }
        }
    ],
    4: [
        {
            type: "Long Word",
            anchor: "PSSA Multi-Digit Operations",
            openEnded: false,
            gen: () => {
                const start = rand(150, 300);
                const step1 = rand(50, 120);
                const step2 = rand(30, 80);
                const final = start + step1 - step2;
                const d1 = start + step1;
                const commonError1 = start + step1 + step2;
                const commonError2 = step1 + step2;
                const distractors = [commonError1.toString(), (final + 10).toString(), commonError2.toString()];

                const scenarios = [
                    {
                        q: `An electronics store had ${start} items in their inventory. They received a shipment of ${step1} new items and then sold ${step2} items. How many items remain in inventory?`,
                        guide: `Start with ${start} items. Add the shipment: ${start} + ${step1} = ${d1}. Subtract the sold items: ${d1} - ${step2} = ${final}.`
                    },
                    {
                        q: `A library had ${start} books at the start of the month. Volunteers donated ${step1} books. The library then gave away ${step2} books to another school. How many books does the library have now?`,
                        guide: `Beginning amount: ${start} books. Add donations: ${start} + ${step1} = ${d1}. Subtract books given away: ${d1} - ${step2} = ${final}.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return { q: chosen.q, ans: final.toString(), distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Pictograph",
            openEnded: false,
            gen: () => {
                const scale = 5;
                const cats = rand(2, 5) * scale;
                const dogs = rand(3, 6) * scale;
                const ans = cats + dogs;
                const distractors = [(dogs - cats).toString(), (cats * 2).toString(), (dogs).toString()];

                return {
                    q: `This pictograph shows pets owned by students in Grade 4. Each symbol represents 5 pets. How many cats and dogs were owned in total?`,
                    ans: ans.toString(),
                    distractors,
                    guide: `Count the symbols for cats: ${cats / scale} symbols × 5 = ${cats}. Count dogs: ${dogs / scale} symbols × 5 = ${dogs}. Total: ${cats} + ${dogs} = ${ans}.`,
                    render: (canvas, ctx) => {
                        ctx.fillStyle = '#212529';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText("Pets Owned by Students", 100, 30);
                        ctx.font = '12px sans-serif';
                        ctx.fillText("Cats", 60, 80);
                        ctx.fillText("Dogs", 60, 140);
                        ctx.fillText("(Each symbol = 5 pets)", 60, 200);
                        const sx = 120;
                        for (let i = 0; i < cats / scale; i++) {
                            ctx.fillStyle = '#FF6B6B';
                            ctx.fillText("🐱", sx + (i * 35), 75);
                        }
                        for (let i = 0; i < dogs / scale; i++) {
                            ctx.fillStyle = '#FFB84D';
                            ctx.fillText("🐶", sx + (i * 35), 135);
                        }
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Measurement",
            openEnded: true,
            gen: () => {
                const meters = rand(3, 10);
                const cm = meters * 100;
                const scenarios = [
                    `A ribbon is ${meters} meters long. What is its length in centimeters?`,
                    `A hallway measures ${meters} meters from end to end. Express this distance in centimeters.`,
                    `A rope is exactly ${meters} meters. Convert this to centimeters.`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Enter the number only)</span>`;
                return {
                    q: qText,
                    ans: cm.toString(),
                    guide: `There are 100 centimeters in 1 meter. Multiply: ${meters} × 100 = ${cm}.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Division",
            openEnded: true,
            gen: () => {
                const divisor = rand(4, 9);
                const quotient = rand(12, 30);
                const dividend = divisor * quotient;
                return {
                    q: `Solve this division problem:<br><br>${dividend} ÷ ${divisor} = ?`,
                    ans: quotient.toString(),
                    guide: `${dividend} ÷ ${divisor} = ${quotient}.`
                };
            }
        }
    ],
    5: [
        {
            type: "Long Word",
            anchor: "PSSA Decimal Operations",
            openEnded: false,
            gen: () => {
                const items = rand(2, 5);
                const price = rand(8, 20) + 0.50;
                const total = items * price;
                const paid = Math.ceil(total / 5) * 5;
                const change = paid - total;
                const ans = `$${change.toFixed(2)}`;
                const distractors = [`$${price.toFixed(2)}`, `$${total.toFixed(2)}`, `$${(change + 1).toFixed(2)}`];

                const scenarios = [
                    {
                        q: `An art student buys ${items} paintbrush sets at $${price.toFixed(2)} each. The total store purchase comes to $${total.toFixed(2)}. If the student pays with a $${paid}.00 bill, how much change will they receive?`,
                        guide: `Calculate total cost: ${items} × $${price.toFixed(2)} = $${total.toFixed(2)}. Find change: $${paid}.00 - $${total.toFixed(2)} = $${change.toFixed(2)}.`
                    },
                    {
                        q: `At the book fair, a student selects ${items} books priced at $${price.toFixed(2)} each. The books total $${total.toFixed(2)}. She pays with a $${paid}.00 bill. What is her exact change?`,
                        guide: `Multiply items by price: ${items} × $${price.toFixed(2)} = $${total.toFixed(2)}. Subtract from payment: $${paid}.00 - $${total.toFixed(2)} = $${change.toFixed(2)}.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return { q: chosen.q, ans, distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Line Plot",
            openEnded: false,
            gen: () => {
                const heights = [rand(2, 4), rand(3, 5), rand(4, 6), rand(5, 7)];
                const sum = heights.reduce((a, b) => a + b, 0);
                const distractors = [heights[0].toString(), heights[2].toString(), (sum - 1).toString()];

                return {
                    q: `The line plot shows the heights (in cm) of plant seedlings measured after 2 weeks. What is the total height of all plants combined?`,
                    ans: sum.toString(),
                    distractors,
                    guide: `Add all measurements: ${heights[0]} + ${heights[1]} + ${heights[2]} + ${heights[3]} = ${sum}.`,
                    render: (canvas, ctx) => {
                        ctx.fillStyle = '#212529';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText("Plant Heights (cm)", 120, 30);
                        ctx.font = '11px sans-serif';
                        ctx.beginPath();
                        ctx.moveTo(50, 100);
                        ctx.lineTo(350, 100);
                        ctx.stroke();
                        for (let i = 0; i < 4; i++) {
                            ctx.fillText(i + 2, 50 + (i * 100) - 5, 115);
                        }
                        heights.forEach((h, i) => {
                            const x = 50 + (i * 100);
                            ctx.fillStyle = '#04AA6D';
                            for (let j = 0; j < h; j++) {
                                ctx.fillText("✕", x - 4, 90 - (j * 15));
                            }
                        });
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Volume",
            openEnded: true,
            gen: () => {
                const l = rand(4, 10);
                const w = rand(3, 8);
                const h = rand(3, 7);
                const vol = l * w * h;
                const scenarios = [
                    `A rectangular storage box measures ${l} cm long, ${w} cm wide, and ${h} cm tall. What is the volume of the box?`,
                    `An aquarium is ${l} cm in length, ${w} cm in width, and ${h} cm in height. Calculate the total volume.`,
                    `A gift box has dimensions of ${l} cm × ${w} cm × ${h} cm. What is its volume?`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Enter the number only, in cubic cm)</span>`;
                return {
                    q: qText,
                    ans: vol.toString(),
                    guide: `Volume = length × width × height = ${l} × ${w} × ${h} = ${vol} cubic cm.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Fractions",
            openEnded: true,
            gen: () => {
                const whole = rand(5, 15);
                const frac = 3;
                const denom = 4;
                const ans = (whole * frac) / denom;
                return {
                    q: `Solve this fraction problem:<br><br>${whole} × (${frac}/${denom}) = ?`,
                    ans: ans.toString(),
                    guide: `Multiply: (${whole} × ${frac}) ÷ ${denom} = ${whole * frac} ÷ ${denom} = ${ans}.`
                };
            }
        }
    ],
    6: [
        {
            type: "Long Word",
            anchor: "PSSA Ratios & Proportions",
            openEnded: false,
            gen: () => {
                const ratio1 = rand(2, 4);
                const ratio2 = rand(3, 6);
                const scale = rand(3, 7);
                const actual1 = ratio1 * scale;
                const actual2 = ratio2 * scale;
                const total = actual1 + actual2;
                const ans = actual1.toString();
                const distractors = [actual2.toString(), ratio1.toString(), ratio2.toString()];

                const scenarios = [
                    {
                        q: `A recipe uses flour and sugar in the ratio ${ratio1}:${ratio2}. If the total ingredients equal ${total} cups, how many cups of flour are used?`,
                        guide: `Total ratio parts: ${ratio1} + ${ratio2} = ${ratio1 + ratio2}. Each part equals: ${total} ÷ ${ratio1 + ratio2} = ${scale}. Flour amount: ${ratio1} × ${scale} = ${actual1}.`
                    },
                    {
                        q: `A paint mixture combines red and blue paint in a ratio of ${ratio1}:${ratio2}. If the final mixture totals ${total} liters, what volume of red paint is in the mixture?`,
                        guide: `Sum of ratio: ${ratio1} + ${ratio2} = ${ratio1 + ratio2}. Value per ratio unit: ${total} ÷ ${ratio1 + ratio2} = ${scale}. Red paint: ${ratio1} × ${scale} = ${actual1}.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return { q: chosen.q, ans, distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Data Analysis",
            openEnded: false,
            gen: () => {
                const scores = [rand(65, 75), rand(75, 85), rand(80, 90), rand(85, 95)];
                const min = Math.min(...scores);
                const max = Math.max(...scores);
                const range = max - min;
                const ans = range.toString();
                const distractors = [(range + 5).toString(), (range - 5).toString(), scores[0].toString()];

                return {
                    q: `A class tracked test scores throughout the semester. The scores were: ${scores[0]}, ${scores[1]}, ${scores[2]}, ${scores[3]}. What is the range of student scores?`,
                    ans,
                    distractors,
                    guide: `Range = Maximum value - Minimum value = ${max} - ${min} = ${range}.`,
                    render: (canvas, ctx) => {
                        ctx.fillStyle = '#212529';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText("Test Score Distribution", 110, 30);
                        ctx.font = '12px sans-serif';
                        for (let i = 0; i < scores.length; i++) {
                            const x = 80 + (i * 80);
                            const barHeight = (scores[i] - 50) * 1.5;
                            ctx.fillStyle = '#1976D2';
                            ctx.fillRect(x, 200 - barHeight, 50, barHeight);
                            ctx.fillStyle = '#212529';
                            ctx.fillText(scores[i], x + 10, 215);
                            ctx.fillText(`Test ${i + 1}`, x + 5, 230);
                        }
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Unit Rates",
            openEnded: true,
            gen: () => {
                const distance = rand(120, 250);
                const time = rand(3, 6);
                const rate = distance / time;
                const scenarios = [
                    `A delivery truck travels ${distance} km in ${time} hours. What is the average speed in km per hour?`,
                    `A runner covers ${distance} meters in ${time} minutes. What is their average speed?`,
                    `A cyclist completes ${distance} km in ${time} hours. Calculate the average speed.`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Enter the number only)</span>`;
                return {
                    q: qText,
                    ans: rate.toString(),
                    guide: `Unit rate = Total distance ÷ Time = ${distance} ÷ ${time} = ${rate}.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Linear Expressions",
            openEnded: true,
            gen: () => {
                const coef = rand(3, 8);
                const constant = rand(5, 20);
                const x = rand(2, 8);
                const result = (coef * x) + constant;
                return {
                    q: `Evaluate the expression for x = ${x}:<br><br>${coef}x + ${constant}`,
                    ans: result.toString(),
                    guide: `Substitute x = ${x}: (${coef} × ${x}) + ${constant} = ${coef * x} + ${constant} = ${result}.`
                };
            }
        }
    ],
    7: [
        {
            type: "Long Word",
            anchor: "PSSA Percent Change",
            openEnded: false,
            gen: () => {
                const original = rand(40, 100);
                const discountPercent = rand(10, 30);
                const discount = original * (discountPercent / 100);
                const finalPrice = original - discount;
                const ans = `$${finalPrice.toFixed(2)}`;
                const distractors = [`$${discount.toFixed(2)}`, `$${original - discountPercent}`, `$${(original * 1.1).toFixed(2)}`];

                const scenarios = [
                    {
                        q: `A clothing store has a jacket originally priced at $${original}. During an end-of-season sale, all items are marked ${discountPercent}% off. What is the sale price?`,
                        guide: `Calculate discount: $${original} × 0.${discountPercent} = $${discount.toFixed(2)}. Sale price: $${original} - $${discount.toFixed(2)} = $${finalPrice.toFixed(2)}.`
                    },
                    {
                        q: `An electronics store is having a clearance event. A tablet originally costs $${original} and is discounted by ${discountPercent}%. What is the new price?`,
                        guide: `Find discount amount: $${original} × 0.${discountPercent} = $${discount.toFixed(2)}. New price: $${original} - $${discount.toFixed(2)} = $${finalPrice.toFixed(2)}.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return { q: chosen.q, ans, distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Slope & Linear Relations",
            openEnded: false,
            gen: () => {
                const slope = rand(2, 4);
                const points = [];
                for (let i = 1; i <= 4; i++) {
                    points.push(`(${i}, ${slope * i})`);
                }
                const ans = slope.toString();
                const distractors = [(slope + 1).toString(), (slope - 1).toString(), (slope / 2).toString()];

                return {
                    q: `On the coordinate plane below, a straight line passes through several points: ${points.join(', ')}. What is the slope of this line?`,
                    ans,
                    distractors,
                    guide: `Slope = rise ÷ run. Between the points, the rise is ${slope} and the run is 1, so slope = ${slope} ÷ 1 = ${slope}.`,
                    render: (canvas, ctx) => {
                        const size = 300;
                        const step = 40;
                        drawCartesianGrid(ctx, size, size, step);
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = '#212529';
                        const center = size / 2;
                        ctx.beginPath();
                        ctx.moveTo(center, 0);
                        ctx.lineTo(center, size);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0, center);
                        ctx.lineTo(size, center);
                        ctx.stroke();
                        ctx.lineWidth = 2.5;
                        ctx.strokeStyle = '#004085';
                        ctx.beginPath();
                        for (let i = 0; i <= 5; i++) {
                            const px = center + (i * step);
                            const py = center - (i * slope * step);
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.stroke();
                        ctx.fillStyle = '#FF6B6B';
                        for (let i = 1; i <= 3; i++) {
                            const px = center + (i * step);
                            const py = center - (i * slope * step);
                            ctx.beginPath();
                            ctx.arc(px, py, 4, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Integers",
            openEnded: true,
            gen: () => {
                const start = -(rand(50, 150));
                const rise = rand(40, 80);
                const fall = rand(20, 60);
                const result = start + rise - fall;
                const scenarios = [
                    `A submarine is at ${start} feet below sea level. It rises ${rise} feet, then descends ${fall} feet. What is its final depth?`,
                    `The temperature is ${start}°C. It rises by ${rise}°C, then drops by ${fall}°C. What is the final temperature?`,
                    `A bank account has a balance of $${start}. After a deposit of $${rise} and a withdrawal of $${fall}, what is the new balance?`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Include negative sign if applicable)</span>`;
                return {
                    q: qText,
                    ans: result.toString(),
                    guide: `Start: ${start}. Add rise: ${start} + ${rise} = ${start + rise}. Subtract fall: ${start + rise} - ${fall} = ${result}.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Percentage",
            openEnded: true,
            gen: () => {
                const percent = rand(2, 9) * 10;
                const base = rand(10, 50) * 10;
                const ans = base * (percent / 100);
                return {
                    q: `Calculate ${percent}% of ${base}:<br><br>What is ${percent}% of ${base}?`,
                    ans: ans.toString(),
                    guide: `Convert percent to decimal: ${percent}% = 0.${percent}. Multiply: 0.${percent} × ${base} = ${ans}.`
                };
            }
        }
    ],
    8: [
        {
            type: "Long Word",
            anchor: "PSSA Systems of Equations",
            openEnded: false,
            gen: () => {
                const smallPrice = 8;
                const largePrice = 15;
                const totalItems = rand(20, 35);
                const largeCount = rand(8, totalItems - 5);
                const smallCount = totalItems - largeCount;
                const totalRevenue = (smallPrice * smallCount) + (largePrice * largeCount);
                const ans = largeCount.toString();
                const distractors = [smallCount.toString(), (largeCount + 3).toString(), (largeCount - 2).toString()];

                const scenarios = [
                    {
                        q: `A café sold small coffees for $${smallPrice} and large coffees for $${largePrice}. In total, they sold ${totalItems} coffees and earned $${totalRevenue}. How many large coffees were sold?`,
                        guide: `Let s = small, l = large. Set up: s + l = ${totalItems} and ${smallPrice}s + ${largePrice}l = ${totalRevenue}. Solve to find l = ${largeCount}.`
                    },
                    {
                        q: `A bookstore sells paperback books for $${smallPrice} and hardcover books for $${largePrice}. One day, they sold ${totalItems} books total and made $${totalRevenue}. How many hardcover books did they sell?`,
                        guide: `Equations: p + h = ${totalItems} and ${smallPrice}p + ${largePrice}h = ${totalRevenue}. Solving gives h = ${largeCount}.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return { q: chosen.q, ans, distractors, guide: chosen.guide };
            }
        },
        {
            type: "Visual Graph",
            anchor: "PSSA Functions & Graphing",
            openEnded: false,
            gen: () => {
                const slope = rand(2, 3);
                const yIntercept = rand(-2, 2);
                const sign = yIntercept >= 0 ? "+" : "-";
                const absB = Math.abs(yIntercept);
                const equation = `y = ${slope}x ${sign} ${absB}`;
                const distractors = [
                    `y = ${slope}x ${sign === '+' ? '-' : '+'} ${absB}`,
                    `y = ${yIntercept}x ${sign} ${slope}`,
                    `y = -${slope}x ${sign} ${absB}`
                ];

                return {
                    q: `Which equation correctly represents the line graphed on the coordinate plane below?`,
                    ans: equation,
                    distractors,
                    guide: `The y-intercept is ${yIntercept}. The slope is ${slope}. Therefore, the equation is y = ${slope}x ${sign} ${absB}.`,
                    render: (canvas, ctx) => {
                        const size = 300;
                        const step = 30;
                        const centerX = size / 2;
                        const centerY = size / 2;
                        drawCartesianGrid(ctx, size, size, step);
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = '#999';
                        ctx.beginPath();
                        ctx.moveTo(centerX, 0);
                        ctx.lineTo(centerX, size);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0, centerY);
                        ctx.lineTo(size, centerY);
                        ctx.stroke();
                        ctx.lineWidth = 2.5;
                        ctx.strokeStyle = '#004085';
                        ctx.beginPath();
                        for (let x = -4; x <= 4; x++) {
                            const px = centerX + (x * step);
                            const py = centerY - ((slope * x + yIntercept) * step);
                            if (x === -4) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.stroke();
                    }
                };
            }
        },
        {
            type: "Short Word",
            anchor: "PSSA Pythagorean Theorem",
            openEnded: true,
            gen: () => {
                const scale = rand(2, 5);
                const a = 3 * scale;
                const b = 4 * scale;
                const c = 5 * scale;
                const scenarios = [
                    `A construction crew needs to position a ladder against a wall. The wall rises ${b} meters vertically, and the base of the ladder is ${a} meters from the wall. What is the length of the ladder needed?`,
                    `A soccer field is rectangular with dimensions ${a} meters by ${b} meters. What is the diagonal distance from one corner to the opposite corner?`,
                    `An artist creates a triangular canvas with legs measuring ${a} cm and ${b} cm. If it's a right triangle, what is the length of the hypotenuse?`
                ];
                const qText = scenarios[rand(0, 2)] + `<br><br><span style="font-size:0.9rem; color:#495057">(Enter the number only)</span>`;
                return {
                    q: qText,
                    ans: c.toString(),
                    guide: `Using the Pythagorean theorem: a² + b² = c². (${a})² + (${b})² = ${a * a} + ${b * b} = ${a * a + b * b}. √${a * a + b * b} = ${c}.`
                };
            }
        },
        {
            type: "Direct Math",
            anchor: "PSSA Scientific Notation",
            openEnded: true,
            gen: () => {
                const mantissa = rand(2, 9);
                const exponent = rand(4, 7);
                const expanded = mantissa * Math.pow(10, exponent);
                return {
                    q: `Convert from scientific notation to standard form:<br><br>${mantissa} × 10^${exponent} = ?`,
                    ans: expanded.toString(),
                    guide: `Move the decimal point ${exponent} places to the right: ${mantissa} × 10^${exponent} = ${expanded}.`
                };
            }
        }
    ],
    algebra: [
        {
            type: "Keystone Quadratic",
            anchor: "Keystone Algebra",
            openEnded: false,
            gen: () => {
                const a = rand(1, 3);
                const b = rand(-5, 5);
                const c = rand(-8, 8);
                const x1 = rand(-4, 4);
                const x2 = rand(-4, 4);
                if (x1 === x2) return Templates.algebra[0].gen();
                const discriminant = (b * b) - (4 * a * c);
                const roots = `x = ${x1} or x = ${x2}`;
                const incorrectRoot = `x = ${x1 + 1} or x = ${x2}`;
                const distractors = [incorrectRoot, `x = ${x1 - 1}`, "No real solutions"];

                return {
                    q: `Solve the quadratic equation:<br><br>${a}x² + ${b}x + ${c} = 0<br><br>What are the solutions?`,
                    ans: roots,
                    distractors,
                    guide: `Use the quadratic formula or factoring. The solutions are x = ${x1} and x = ${x2}.`
                };
            }
        },
        {
            type: "Keystone Linear Systems",
            anchor: "Keystone Algebra",
            openEnded: false,
            gen: () => {
                const x = rand(2, 8);
                const y = rand(2, 8);
                const m1 = rand(1, 3);
                const b1 = rand(1, 10);
                const m2 = rand(1, 3);
                const b2 = rand(1, 10);
                const y1 = (m1 * x) + b1;
                const y2 = (m2 * x) + b2;
                const ans = `(${x}, ${y1})`;
                const distractors = [`(${x}, ${y2})`, `(${y1}, ${x})`, `(${x + 1}, ${y1})`];

                return {
                    q: `Which ordered pair satisfies this linear system?<br><br>y = ${m1}x + ${b1}<br>y = ${m2}x + ${b2}`,
                    ans,
                    distractors,
                    guide: `Substitute x-values to find which point satisfies both equations. The solution is (${x}, ${y1}).`
                };
            }
        },
        {
            type: "Keystone Functions",
            anchor: "Keystone Algebra",
            openEnded: false,
            gen: () => {
                const x = rand(2, 10);
                const coef = rand(2, 5);
                const constant = rand(3, 15);
                const result = (coef * x) + constant;
                const wrongResult1 = coef * x;
                const wrongResult2 = (coef * (x + 1)) + constant;
                const distractors = [wrongResult1.toString(), wrongResult2.toString(), (result + coef).toString()];

                return {
                    q: `Given f(x) = ${coef}x + ${constant}, find f(${x}):`,
                    ans: result.toString(),
                    distractors,
                    guide: `Substitute x = ${x}: f(${x}) = ${coef}(${x}) + ${constant} = ${coef * x} + ${constant} = ${result}.`
                };
            }
        },
        {
            type: "Keystone Expressions",
            anchor: "Keystone Algebra",
            openEnded: true,
            gen: () => {
                const a = rand(3, 8);
                const b = rand(2, 5);
                const x = rand(4, 10);
                const result = (a * x) - (b * x);
                const simplified = a - b;

                return {
                    q: `Simplify the algebraic expression:<br><br>${a}x - ${b}x = `,
                    ans: `${simplified}x`,
                    guide: `Combine like terms: (${a} - ${b})x = ${simplified}x`
                };
            }
        }
    ],
    biology: [
        {
            type: "Keystone Genetics",
            anchor: "Keystone Biology",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `In guinea pigs, black fur is dominant (B) and white fur is recessive (b). If a heterozygous black guinea pig (Bb) is crossed with a homozygous white guinea pig (bb), what is the probability that offspring will have white fur?`,
                        ans: "50%",
                        distractors: ["25%", "75%", "100%"],
                        guide: `Bb × bb produces: Bb (black) and bb (white). 50% of offspring are white.`
                    },
                    {
                        q: `In a monohybrid cross of Aa × Aa, what ratio of dominant to recessive phenotypes would you expect in the offspring?`,
                        ans: "3:1",
                        distractors: ["1:1", "1:3", "2:1"],
                        guide: `Aa × Aa produces: AA, Aa, Aa, aa. The ratio is 3 dominant : 1 recessive.`
                    },
                    {
                        q: `Which of the following best describes what occurs during the S phase of the cell cycle?`,
                        ans: "DNA replication",
                        distractors: ["Mitosis", "Cytokinesis", "Spindle formation"],
                        guide: `The S phase (Synthesis phase) is when DNA replication occurs in preparation for cell division.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Photosynthesis",
            anchor: "Keystone Biology",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `What are the two main statements of photosynthesis equation?`,
                        ans: "Carbon dioxide and water produce glucose and oxygen",
                        distractors: ["Glucose and oxygen produce carbon dioxide and water", "Light energy produces chlorophyll", "Chlorophyll absorbs glucose"],
                        guide: `Photosynthesis converts CO₂ and H₂O into glucose and O₂ using light energy.`
                    },
                    {
                        q: `Which structure in a plant cell is primarily responsible for photosynthesis?`,
                        ans: "Chloroplast",
                        distractors: ["Mitochondria", "Nucleus", "Ribosome"],
                        guide: `Chloroplasts contain chlorophyll and are the sites of photosynthesis.`
                    },
                    {
                        q: `During which stage of photosynthesis does the light-dependent reaction occur?`,
                        ans: "Light reactions (in thylakoid membranes)",
                        distractors: ["Dark reactions", "Calvin cycle", "Fermentation"],
                        guide: `Light reactions occur in the thylakoid membranes where light is directly used.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Ecology",
            anchor: "Keystone Biology",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `In a food chain: grass → rabbit → eagle, what is the rabbit's role?`,
                        ans: "Primary consumer",
                        distractors: ["Decomposer", "Producer", "Secondary consumer"],
                        guide: `The rabbit consumes the producer (grass), making it a primary consumer.`
                    },
                    {
                        q: `Which of the following describes biodiversity?`,
                        ans: "The variety of species in an ecosystem",
                        distractors: ["The number of predators in an area", "The total biomass of organisms", "The migration patterns of animals"],
                        guide: `Biodiversity refers to the variety of species present in a particular environment.`
                    },
                    {
                        q: `What is the role of decomposers in an ecosystem?`,
                        ans: "Break down dead organisms and recycle nutrients",
                        distractors: ["Produce oxygen through photosynthesis", "Hunt and consume producers", "Transport water through soil"],
                        guide: `Decomposers like bacteria and fungi break down dead matter, returning nutrients to the soil.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Body Systems",
            anchor: "Keystone Biology",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `Which organ system is responsible for transporting oxygen and nutrients throughout the body?`,
                        ans: "Circulatory system",
                        distractors: ["Digestive system", "Nervous system", "Muscular system"],
                        guide: `The circulatory system (heart, blood vessels, blood) transports oxygen and nutrients.`
                    },
                    {
                        q: `What is the primary function of the immune system?`,
                        ans: "Defend the body against pathogens and disease",
                        distractors: ["Digest food", "Transport hormones", "Provide structural support"],
                        guide: `The immune system fights infections through white blood cells and antibodies.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return chosen;
            }
        }
    ],
    literature: [
        {
            type: "Keystone Literary Elements",
            anchor: "Keystone Literature",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `Which literary device is demonstrated in the phrase: "The city that never sleeps"?`,
                        ans: "Personification",
                        distractors: ["Metaphor", "Simile", "Hyperbole"],
                        guide: `Personification attributes human qualities to non-human things. Cities don't literally sleep.`
                    },
                    {
                        q: `What does the term "protagonist" refer to?`,
                        ans: "The main character in a story",
                        distractors: ["The setting of a story", "The conflict in a story", "The theme of a story"],
                        guide: `The protagonist is the central character, often facing the main conflict.`
                    },
                    {
                        q: `Which type of conflict occurs when a character struggles against nature or society?`,
                        ans: "External conflict",
                        distractors: ["Internal conflict", "Ironic conflict", "Symbolic conflict"],
                        guide: `External conflict involves a character fighting against outside forces; internal conflict is inner struggle.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Comprehension",
            anchor: "Keystone Literature",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `Which statement best describes the main theme of a coming-of-age story?`,
                        ans: "A character's transition from youth to maturity",
                        distractors: ["A character's struggle with poverty", "A story set in historical times", "A narrative told in first person"],
                        guide: `Coming-of-age stories follow a protagonist's journey toward maturity and self-understanding.`
                    },
                    {
                        q: `What is the author's purpose in using foreshadowing in a narrative?`,
                        ans: "To create suspense and hint at future events",
                        distractors: ["To slow down the plot", "To confuse the reader", "To introduce new characters"],
                        guide: `Foreshadowing plants clues that prepare readers for later plot developments.`
                    },
                    {
                        q: `Which narrative point of view allows the reader to know the thoughts of all characters?`,
                        ans: "Omniscient third person",
                        distractors: ["First person", "Limited third person", "Second person"],
                        guide: `An omniscient narrator knows and can reveal the thoughts and feelings of all characters.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Vocabulary",
            anchor: "Keystone Literature",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `What does the word "ambiguous" mean?`,
                        ans: "Open to more than one interpretation; unclear",
                        distractors: ["Obvious and clear", "Skillfully done", "Difficult to achieve"],
                        guide: `Ambiguous means something has multiple possible meanings or is unclear in intent.`
                    },
                    {
                        q: `Which word best describes a cynical character?`,
                        ans: "Distrustful of others' motives and pessimistic",
                        distractors: ["Optimistic and hopeful", "Timid and shy", "Confident and proud"],
                        guide: `A cynical person distrusts human nature and expects the worst outcomes.`
                    },
                    {
                        q: `What does "melancholy" refer to?`,
                        ans: "Deep sadness or gloom",
                        distractors: ["Extreme anger ", "Joy and excitement", "Confusion and bewilderment"],
                        guide: `Melancholy describes a state of pensive sadness or thoughtful gloom.`
                    }
                ];
                const chosen = scenarios[rand(0, 2)];
                return chosen;
            }
        },
        {
            type: "Keystone Text Analysis",
            anchor: "Keystone Literature",
            openEnded: false,
            gen: () => {
                const scenarios = [
                    {
                        q: `When analyzing a text, what is the relationship between theme and author's message?`,
                        ans: "Theme is the universal idea; author's message is how it's conveyed",
                        distractors: ["They are exactly the same concept", "Theme only appears in poetry", "Author's message is hidden"],
                        guide: `Theme is what the text means; author's message is the specific point they're making.`
                    },
                    {
                        q: `Why do authors use symbolism in literary works?`,
                        ans: "To represent abstract ideas through concrete objects or images",
                        distractors: ["To make the text longer", "To confuse readers", "To replace dialogue"],
                        guide: `Symbolism allows writers to convey deeper meaning through symbolic imagery.`
                    }
                ];
                const chosen = scenarios[rand(0, 1)];
                return chosen;
            }
        }
    ]
};

