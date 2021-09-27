"use strict";

let timer = document.getElementById("timer");
let timeout;
let skipAnimation = false;
let lastValue = 0;

let original = Date.now();
function update() {
    let val = Math.round((Date.now() - original) / 1000);
    flipDigits(val);
    timeout = setTimeout(update, (val + 1) * 1000 + original - Date.now());
}

function flipDigits(num) {
    lastValue = num;
    let text = num.toString();
    while (text.length > timer.childElementCount) {
        let digit = buildDigit();
        digit.addEventListener("animationend", () => {
            digit.children[0].textContent = digit.children[1].textContent;
            digit.classList.remove("flip");
        });
        timer.prepend(digit);
    }

    while (text.length < timer.childElementCount) {
        timer.firstChild.remove();
    }

    for (let i = text.length - 1; i >= 0; i--) {
        if (timer.children[i].children[0].textContent != text[i]) {
            if (!skipAnimation) {
                timer.children[i].children[1].textContent = text[i];
                timer.children[i].classList.add("flip");
            } else {
                timer.children[i].children[0].textContent = text[i];
                timer.children[i].classList.remove("flip");
            }
        }
    }
    skipAnimation = false;
}

function buildDigit() {
    let container = document.createElement("div");
    container.classList.add("digit");
    let current = document.createElement("div");
    // \xa0 is &nbsp;
    current.textContent = "\xa0";
    container.append(current);
    let temp = document.createElement("div");
    temp.textContent = "\xa0";
    container.append(temp);
    return container;
}

update();

let edit = document.getElementById("edit");
let editClose = document.getElementById("edit-close");
let editor = document.getElementById("editor");
editor.style.display = "none";

edit.addEventListener("click", ev => {
    ev.preventDefault();
    openEditor();
});

editClose.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    closeEditor();
});

editor.addEventListener("keydown", ev => {
    if (ev.key === "Enter") {
        closeEditor();
    }
});

function openEditor() {
    editClose.classList.add("edit-open");
    clearTimeout(timeout);
    editor.value = lastValue;
    editor.style.display = "block";
    timer.style.display = "none";
}

function closeEditor() {
    editClose.classList.remove("edit-open");
    clearTimeout(timeout);
    editor.style.display = "none";
    timer.style.display = "";
    let newValue = parseInt(editor.value);
    original = Date.now() - (isNaN(newValue) ? 0 : newValue) * 1000;
    skipAnimation = true;
    update();
}
