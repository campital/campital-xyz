'use strict';

const pixelsPerUnit = 50;

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
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
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

class ShoelaceAlgorithm {
    constructor(points) {
        if(points.length < 3) {
            throw new Error('Must provide at least 3 points!');
        }

        this.points = points;
        this.reset();
    }

    step() {
        if(this.position >= this.points.length) {
            return 'done';
        }

        this.position++;

        if(this.position != this.points.length) {
            this.area += (this.points[this.position].x - this.points[this.position - 1].x) * (this.points[this.position].y + this.points[this.position - 1].y) / 2;
        } else {
            this.area += (this.points[0].x - this.points[this.position - 1].x) * (this.points[0].y + this.points[this.position - 1].y) / 2;
        }
        return 'add';
    }

    reset() {
        this.area = 0;
        this.position = 0;
    }

    currentPosition() {
        return this.position;
    }

    currentArea() {
        return Math.abs(this.area);
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
    const pX = ev.offsetX * window.devicePixelRatio;
    const pY = ev.offsetY * window.devicePixelRatio;
    ev.preventDefault();
    globalPoints.push({x: pX, y: pY});
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

const areaText = document.getElementById('area');

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
        let hullPoints = [];
        for(let x of currentAlgorithm.currentSequence()) {
            hullPoints.push(globalPoints[x]);
        }
        const areaAlgorithm = new ShoelaceAlgorithm(hullPoints);
        while(areaAlgorithm.step() != 'done');
        areaText.innerText = 'Area: ' + areaAlgorithm.currentArea() / (pixelsPerUnit * pixelsPerUnit) + ' u';
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
    areaText.innerText = 'Area: N/A';
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

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'lightgray';
    for(let x = 0; x < canvas.width; x += pixelsPerUnit) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.closePath();
        ctx.stroke();
    }
    for(let y = 0; y < canvas.height; y += pixelsPerUnit) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.closePath();
        ctx.stroke();
    }

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