let reactants = document.getElementById("reactants");
let products = document.getElementById("products");
let addReactant = document.getElementById("left").getElementsByClassName("add")[0];
let addProduct = document.getElementById("right").getElementsByClassName("add")[0];

function createFormula(id) {
    let input = document.createElement("input");
    input.setAttribute("type", "text");
    input.classList.add("formula");
    input.setAttribute("size", "1");
    input.addEventListener("input", function() {
        this.parentNode.dataset.value = this.value;
        removeCoefficients();
    });
    input.addEventListener("keydown", function(ev) {
        if(input.value.length === 0 && ev.key === "Backspace") {
            removeFormula(id);
        }
    });
    let sizer = document.createElement("div");
    sizer.dataset.value = "";
    sizer.classList.add("formula-sizer");
    sizer.append(input);
    let container = document.createElement("div");
    container.classList.add("formula-container");
    container.classList.add(id);
    container.append(sizer);
    return container;
}

let formulaID = 0;
function addReactantFormula() {
    if (reactants.childElementCount !== 0) {
        reactants.prepend("+");
    }
    reactants.prepend(createFormula(formulaID++));
}

function addProductFormula() {
    if (products.childElementCount !== 0) {
        products.append("+");
    }
    products.append(createFormula(formulaID++));
}

function removeFormula(id) {
    let element = reactants.getElementsByClassName("formula-container " + id);
    if(element.length !== 0 && element[0].nextSibling) {
        element[0].nextSibling.remove();
        element[0].remove();
    }
    element = products.getElementsByClassName("formula-container " + id);
    if(element.length !== 0 && element[0].previousSibling) {
        element[0].previousSibling.remove();
        element[0].remove();
    }
}

function removeCoefficients() {
    for(let x of reactants.childNodes) {
        if(x.tagName === "DIV" && x.firstChild.tagName === "SPAN") {
            x.removeChild(x.firstChild);
        }
    }
    for(let x of products.childNodes) {
        if(x.tagName === "DIV" && x.firstChild.tagName === "SPAN") {
            x.removeChild(x.firstChild);
        }
    }
}

addReactantFormula();
addProductFormula();

addReactant.addEventListener("click", addReactantFormula);
addProduct.addEventListener("click", addProductFormula);

document.getElementById("yields").addEventListener("click", function() {
    let result;
    try {
        result = balance();
    } catch(err) {
        console.error("Error balancing equation!");
        removeCoefficients();
        return;
    }

    let i = 0;
    for(let x of reactants.childNodes) {
        if(x.tagName !== "DIV") {
            continue;
        }

        if(x.firstChild.tagName !== "SPAN") {
            let num = document.createElement("span");
            num.classList.add("coefficient");
            num.innerText = result[i];
            num.style.display = "inline";
            x.prepend(num);
        } else {
            x.firstChild.innerText = result[i];
        }
        i++;
    }
    for(let x of products.children) {
        if(x.tagName !== "DIV") {
            continue;
        }
        
        if(x.firstChild.tagName !== "SPAN") {
            let num = document.createElement("span");
            num.classList.add("coefficient");
            num.innerText = result[i];
            num.style.display = "inline";
            x.prepend(num);
        } else {
            x.firstChild.innerText = result[i];
        }
        i++;
    }
});

function parseFormula(formula, isRecurse) {
    let elements = {};
    let name = "";
    for (let i = 0; i < formula.length; i++) {
        if(formula[i] === "(") {
            if (name.length !== 0) {
                if (typeof elements[name] === "number") {
                    elements[name] += 1;
                } else {
                    elements[name] = 1;
                }
                name = "";
            }

            let result = parseFormula(formula.substr(i + 1), true);
            i += result[0] + 2;
            if(i < formula.length && /[0-9]/.test(formula[i])) {
                let scalar = parseInt(formula.substr(i), 10);
                for(let x in result[1]) {
                    result[1][x] *= scalar;
                }
                i += formula.substr(i).match(/^[0-9]+/)[0].length;
            }
            for(let x in result[1]) {
                if (typeof elements[x] === "number") {
                    elements[x] += result[1][x];
                } else {
                    elements[x] = result[1][x];
                }
            }
            i--;
        } else if(formula[i] === ")") {
            if(!isRecurse) {
                throw new Error("Invalid formula!");
            }

            // duplicate code
            if (name.length !== 0) {
                if (typeof elements[name] === "number") {
                    elements[name] += 1;
                } else {
                    elements[name] = 1;
                }
                name = "";
            }
            return [i, elements];
        } else if (/[A-Z]/.test(formula[i])) {
            if (name.length !== 0) {
                if (typeof elements[name] === "number") {
                    elements[name] += 1;
                } else {
                    elements[name] = 1;
                }
            }
            name = formula[i];
        } else if (/[0-9]/.test(formula[i])) {
            if (name.length !== 0) {
                if (typeof elements[name] === "number") {
                    elements[name] += parseInt(formula.substr(i), 10);
                } else {
                    elements[name] = parseInt(formula.substr(i), 10);
                }
                name = "";
            }
            i += formula.substr(i).match(/^[0-9]+/)[0].length - 1;
        } else if (/[a-z]/.test(formula[i])) {
            name += formula[i];
        }
    }
    if (name.length !== 0) {
        if (typeof elements[name] === "number") {
            elements[name] += 1;
        } else {
            elements[name] = 1;
        }
        name = "";
    }
    if(isRecurse) {
        throw new Error("Invalid formula!");
    }
    return elements;
}

function balance() {
    let proportions = [];
    let indices = {};

    arrangeFormulas(proportions, indices, reactants.getElementsByTagName("input"), 1);
    arrangeFormulas(proportions, indices, products.getElementsByTagName("input"), -1);
    let result = eliminate(proportions);

    let multiple = 1;
    let coefficients = [];
    for(let i = 0; result.hasOwnProperty(i); i++) {
        let local = result[i].den / gcd(result[i].den, result[i].num);
        multiple = lcm(local, multiple);
    }
    for(let i = 0; result.hasOwnProperty(i); i++) {
        let val = result[i].num * multiple / result[i].den;
        if(val <= 0 || isNaN(val)) {
            throw new Error("Invalid balancer input!");
        }
        coefficients.push(val);
    }
    return coefficients;
}

function arrangeFormulas(proportions, indices, input, scalar) {
    let i = proportions[0] ? proportions[0].length : 0;
    for (let elem of input) {
        let formula = parseFormula(elem.value, false);
        for (let x in indices) {
            if (formula.hasOwnProperty(x)) {
                proportions[indices[x]].push(formula[x] * scalar);
                delete formula[x];
            } else {
                proportions[indices[x]].push(0);
            }
        }

        for (let x in formula) {
            proportions.push(new Array(i).fill(0));
            indices[x] = proportions.length - 1;
            proportions[proportions.length - 1].push(formula[x] * scalar);
        }
        i++;
    }
}

// Uses gaussian elimination to solve a system
function eliminate(matrix) {
    echelon(matrix);
    let variables = {};
    let base = -1;
    for (let i = Math.min(matrix[0].length - 1, matrix.length - 1); i >= 0; i--) {
        if (matrix[i][matrix[0].length - 2]) {
            base = i;
            break;
        }
    }
    if (base == -1) {
        throw new Error("Invalid elimination input!");
    }
    variables[base + 1] = { num: 1, den: 1 };
    for (let i = base; i >= 0; i--) {
        let value = { num: 0, den: 1 };
        for (let n = i + 1; n < matrix[i].length; n++) {
            if (!variables.hasOwnProperty(n)) {
                throw new Error("Invalid elimination input!");
            }
            let scaled = { ...variables[n] };
            scaled.num *= -matrix[i][n];
            addFractions(value, scaled);
        }
        multiplyFractions(value, { num: 1, den: matrix[i][i] });
        variables[i] = value;
    }
    if (!variables.hasOwnProperty(matrix[0].length - 1)) {
        throw new Error("Invalid elimination input!");
    }
    return variables;
}

function echelon(matrix) {
    for (let i = 0; i < matrix[0].length - 1 && i < matrix.length - 1; i++) {
        let chosen = -1;
        for (let n = i; n < matrix.length; n++) {
            if (matrix[n][i] !== 0) {
                chosen = n;
                break;
            }
        }
        if (chosen !== -1) {
            let tmp = matrix[i];
            matrix[i] = matrix[chosen];
            matrix[chosen] = tmp;
            for (let n = i + 1; n < matrix.length; n++) {
                if (matrix[n][i] !== 0) {
                    let factor = lcm(matrix[n][i], matrix[i][i]);
                    multiplyList(matrix[n], factor / Math.abs(matrix[n][i]) * (((matrix[n][i] > 0) == (matrix[i][i] > 0)) ? -1 : 1));
                    let cancel = [...matrix[i]];
                    multiplyList(cancel, factor / Math.abs(matrix[i][i]));
                    addLists(matrix[n], cancel);
                }
            }
        }
    }
}

function multiplyList(list, scalar) {
    for (let i = 0; i < list.length; i++) {
        list[i] *= scalar;
    }
}

function addLists(dest, src) {
    for (let i = 0; i < dest.length; i++) {
        dest[i] += src[i];
    }
}

function multiplyFractions(dest, src) {
    dest.num *= src.num;
    dest.den *= src.den;
    let factor = gcd(dest.num, dest.den);
    dest.num /= factor;
    dest.den /= factor;
}

function addFractions(dest, src) {
    let factor = gcd(dest.den, src.den);
    let add = src.num * dest.den / factor;
    dest.den *= src.den / factor;
    dest.num *= src.den / factor;
    dest.num += add;
    multiplyFractions(dest, { num: 1, den: 1 });
}

function lcm(x, y) {
    return (x * y) / gcd(x, y);
}

function gcd(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        let tmp = y;
        y = x % y;
        x = tmp;
    }
    return x;
}
