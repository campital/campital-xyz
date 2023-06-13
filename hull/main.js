'use strict';

function quadrant(point) {
    if(point.x >= 0 && point.y >= 0) {
        return 1;
    } else if(point.x < 0 && point.y >= 0) {
        return 2;
    } else if(point.x < 0 && point.y < 0) {
        return 3;
    }

    return 4;
}

function pointCmp(a, b) {
    if(a.x == 0 && a.y == 0) {
        return -1;
    }

    if(b.x == 0 && b.y == 0) {
        return 1;
    }

    let quadA = quadrant(a);
    let quadB = quadrant(b);
    if(quadA != quadB) {
        return quadA - quadB;
    }

    return a.y / a.x - b.y / b.x;
}

function isClockwise(a, b, c) {
    let quadA = quadrant({x: b.x - a.x, y: b.y - a.y});
    let quadB = quadrant({x: c.x - a.x, y: c.y - a.y});
    let mA = (b.y - a.y) / (b.x - a.x);
    let mB = (c.y - a.y) / (c.x - a.x);
    if(mA < 0) {
        mA = -1 / mA;
    }
    if(mB < 0) {
        mB = -1 / mB;
    }
    
    return (quadA == quadB && mB > mA) || (quadB == quadA + 1 || quadB == quadA - 3) || ((quadB == quadA + 2 || quadB == quadA - 2) && mB < mA);
}

class ConvexHullAlgorithm {
    constructor(points) {
        if(points.length < 3) {
            throw new Error('Must provide at least 3 points!');
        }

        this.points = points;
        
        let maxX = -Infinity;
        let maxI;

        this.pointsSorted = [];
        for(let i = 0; i < points.length; i++) {
            if(points[i].x > maxX) {
                maxX = points[i].x;
                maxI = i;
            }

            this.pointsSorted.push({x: points[i].x, y: points[i].y, i: i});
        }

        this.pivot = points[maxI];
        this.pointsSorted.sort((a, b) => pointCmp({x: a.x - this.pivot.x, y: a.y - this.pivot.y, i: a.i}, {x: b.x - this.pivot.x, y: b.y - this.pivot.y, i: b.i}));

        this.reset();
    }

    step() {
        if(this.hullSequence.length > 2 && !isClockwise(this.points[this.hullSequence[this.hullSequence.length - 3]], this.points[this.hullSequence[this.hullSequence.length - 2]], this.points[this.hullSequence[this.hullSequence.length - 1]])) {
            let tmp = this.hullSequence[this.hullSequence.length - 1];
            this.hullSequence.pop(); this.hullSequence.pop();
            this.hullSequence.push(tmp);
            return 'remove';
        }

        if(this.latestSortedIndex + 1 > this.points.length) {
            return 'done';
        }

        if(this.latestSortedIndex + 1 == this.points.length) {
            this.hullSequence.push(this.pointsSorted[0].i);
            this.latestSortedIndex++;
            return 'add';
        }

        this.hullSequence.push(this.pointsSorted[++this.latestSortedIndex].i);
        return 'add';
    }

    reset() {
        this.hullSequence = [this.pointsSorted[0].i];
        this.latestSortedIndex = 0;
    }

    currentSequence() {
        return this.hullSequence;
    }
}


const canvas = document.getElementById('display');
const ctx = canvas.getContext('2d');
let globalPoints = [];
let running = false;
let stopAnimate = false;
let lastOutput;
let currentAlgorithm;

canvas.addEventListener('click', ev => {
    ev.preventDefault();
    globalPoints.push({x: ev.offsetX * window.devicePixelRatio, y: ev.offsetY * window.devicePixelRatio});
    resetAlgorithm();
    draw();
});

const stepButton = document.getElementById('step');
let currentStep = 0;
stepButton.addEventListener('click', ev => {
    ev.preventDefault();
    if(currentAlgorithm !== undefined && !running) {
        lastOutput = currentAlgorithm.step();
        if(lastOutput != 'done') {
            stepButton.innerText = 'Step (' + (++currentStep) + ')';
        }
        draw();
    }
});

const delayInput = document.getElementById('delay');
const startStopButton = document.getElementById('start-stop');
startStopButton.addEventListener('click', ev => {
    ev.preventDefault();
    if(running) {
        stopAnimate = true;
    } else if(currentAlgorithm !== undefined) {
        running = true;
        startStopButton.innerText = 'Stop';
        scheduledStep();
    }
});

function scheduledStep() {
    if(stopAnimate) {
        stopAnimate = false;
        running = false;
        startStopButton.innerText = 'Start';
        return;
    }
    lastOutput = currentAlgorithm.step();
    if(lastOutput == 'done') {
        stopAnimate = true;
    } else {
        stepButton.innerText = 'Step (' + (++currentStep) + ')';
    }
    draw();
    let setDelay = parseInt(delayInput.value);
    if(setDelay != 0) {
        if(!(setDelay > 0 && setDelay <= 1000)) {
            delayInput.value = '100';
            setDelay = 100;
        }
        setTimeout(scheduledStep, setDelay);
    } else {
        scheduledStep();
    }
}

function resetAlgorithm() {
    if(globalPoints.length > 2) {
        currentAlgorithm = new ConvexHullAlgorithm(globalPoints);
    } else {
        currentAlgorithm = undefined;
    }
    currentStep = 0;
    if(running) {
        stopAnimate = true;
    }
    stepButton.innerText = 'Step (' + currentStep + ')';
    lastOutput = undefined;
}

const resetButton = document.getElementById('reset');
resetButton.addEventListener('click', ev => {
    ev.preventDefault();
    globalPoints = [];
    resetAlgorithm();
    draw();
});

const resetAlgButton = document.getElementById('reset-alg');
resetAlgButton.addEventListener('click', ev => {
    ev.preventDefault();
    resetAlgorithm();
    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let pt of globalPoints) {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fill();
    }

    if(currentAlgorithm !== undefined) {
        const sequence = currentAlgorithm.currentSequence();
        if(lastOutput == 'done') {
            ctx.strokeStyle = 'green';
        } else {
            ctx.strokeStyle = 'yellow';
        }
        
        ctx.lineWidth = 2;
        for(let i = 1; i < sequence.length; i++) {
            if(i == sequence.length - 1 && lastOutput == 'add') {
                ctx.strokeStyle = 'red';
            }
            ctx.beginPath();
            ctx.moveTo(globalPoints[sequence[i - 1]].x, globalPoints[sequence[i - 1]].y);
            ctx.lineTo(globalPoints[sequence[i]].x, globalPoints[sequence[i]].y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

function resize() {
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    draw();
}
resize();
window.addEventListener('resize', resize);