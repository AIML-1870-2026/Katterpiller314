class DecisionBoundaryViz {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resolution = 80;
        this.padding = 40;
        this.isDragging = false;
        this.onPointMoved = null;

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.isDragging = false);
        this.canvas.addEventListener('mouseleave', () => this.isDragging = false);

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.isDragging = false);

        this.currentNeuron = null;
        this.xAxisIndex = 0;
        this.yAxisIndex = 1;
        this.sliderValues = [];
    }

    resize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, 500);
        this.canvas.width = size;
        this.canvas.height = size;
    }

    getPlotCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;
        const plotW = this.canvas.width - 2 * this.padding;
        const plotH = this.canvas.height - 2 * this.padding;
        const xVal = Math.max(0, Math.min(1, (canvasX - this.padding) / plotW));
        const yVal = Math.max(0, Math.min(1, 1 - (canvasY - this.padding) / plotH));
        return { x: xVal, y: yVal };
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.handleDrag(e);
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.handleDrag(e);
    }

    handleDrag(e) {
        const coords = this.getPlotCoords(e.clientX, e.clientY);
        if (this.onPointMoved) {
            this.onPointMoved(this.xAxisIndex, coords.x, this.yAxisIndex, coords.y);
        }
    }

    render(neuron, xAxisIndex, yAxisIndex, sliderValues) {
        this.currentNeuron = neuron;
        this.xAxisIndex = xAxisIndex;
        this.yAxisIndex = yAxisIndex;
        this.sliderValues = sliderValues;

        this.resize();
        const { ctx, canvas, padding, resolution } = this;
        const width = canvas.width;
        const height = canvas.height;
        const plotW = width - 2 * padding;
        const plotH = height - 2 * padding;

        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#fef9fa';
        ctx.fillRect(0, 0, width, height);

        // Render decision regions
        const imageData = ctx.createImageData(Math.ceil(plotW), Math.ceil(plotH));

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const xVal = (i + 0.5) / resolution;
                const yVal = 1 - (j + 0.5) / resolution;
                const inputs = [...sliderValues];
                inputs[xAxisIndex] = xVal;
                inputs[yAxisIndex] = yVal;
                const output = neuron.forward(inputs);

                const px = Math.floor(i * plotW / resolution);
                const py = Math.floor(j * plotH / resolution);
                const pw = Math.ceil((i + 1) * plotW / resolution) - px;
                const ph = Math.ceil((j + 1) * plotH / resolution) - py;

                let r, g, b, a;
                if (output >= 0.5) {
                    const intensity = (output - 0.5) * 2;
                    r = 107; g = 158; b = 125;
                    a = Math.floor(50 + 150 * intensity);
                } else {
                    const intensity = (0.5 - output) * 2;
                    r = 212; g = 120; b = 156;
                    a = Math.floor(50 + 150 * intensity);
                }

                for (let dy = 0; dy < ph && (py + dy) < Math.ceil(plotH); dy++) {
                    for (let dx = 0; dx < pw && (px + dx) < Math.ceil(plotW); dx++) {
                        const idx = ((py + dy) * Math.ceil(plotW) + (px + dx)) * 4;
                        imageData.data[idx] = r;
                        imageData.data[idx + 1] = g;
                        imageData.data[idx + 2] = b;
                        imageData.data[idx + 3] = a;
                    }
                }
            }
        }

        ctx.putImageData(imageData, padding, padding);

        // Draw decision boundary (contour at 0.5)
        ctx.strokeStyle = '#5c4149';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        const boundaryRes = 200;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= boundaryRes; i++) {
            const xVal = i / boundaryRes;
            const inputs = [...sliderValues];
            inputs[xAxisIndex] = xVal;

            let lo = 0, hi = 1;
            const inputsLo = [...inputs]; inputsLo[yAxisIndex] = lo;
            const inputsHi = [...inputs]; inputsHi[yAxisIndex] = hi;
            const outLo = neuron.forward(inputsLo);
            const outHi = neuron.forward(inputsHi);

            if ((outLo >= 0.5) === (outHi >= 0.5)) continue;

            for (let s = 0; s < 20; s++) {
                const mid = (lo + hi) / 2;
                const inputsMid = [...inputs]; inputsMid[yAxisIndex] = mid;
                const outMid = neuron.forward(inputsMid);
                if ((outMid >= 0.5) === (outLo >= 0.5)) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }

            const yBoundary = (lo + hi) / 2;
            const canvasX = padding + xVal * plotW;
            const canvasY = padding + (1 - yBoundary) * plotH;

            if (!started) {
                ctx.moveTo(canvasX, canvasY);
                started = true;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();

        // Light grid lines
        ctx.strokeStyle = 'rgba(140, 112, 120, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (let i = 1; i < 4; i++) {
            const x = padding + (i / 4) * plotW;
            const y = padding + (i / 4) * plotH;
            ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, padding + plotH); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(padding + plotW, y); ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw plot border
        ctx.strokeStyle = '#e4c0ca';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, plotW, plotH);

        // Axis name labels
        ctx.fillStyle = '#5c4149';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(neuron.inputs[xAxisIndex].name, padding + plotW / 2, height - 14);

        ctx.save();
        ctx.translate(12, padding + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'middle';
        ctx.fillText(neuron.inputs[yAxisIndex].name, 0, 0);
        ctx.restore();

        // Low / High endpoint labels instead of numeric ticks
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#b09da3';

        // X-axis: Low left, High right
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Low', padding, padding + plotH + 4);
        ctx.textAlign = 'right';
        ctx.fillText('High', padding + plotW, padding + plotH + 4);

        // Y-axis: Low bottom, High top
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Low', padding - 5, padding + plotH);
        ctx.textBaseline = 'top';
        ctx.fillText('High', padding - 5, padding);

        // Draw current position marker
        const cx = padding + sliderValues[xAxisIndex] * plotW;
        const cy = padding + (1 - sliderValues[yAxisIndex]) * plotH;
        const currentOutput = neuron.forward(sliderValues);
        const isYes = currentOutput >= 0.5;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = isYes ? 'rgba(74, 125, 92, 0.15)' : 'rgba(176, 85, 120, 0.15)';
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = isYes ? '#4a7d5c' : '#b05578';
        ctx.fill();
        ctx.strokeStyle = '#fffbfc';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Small label next to the dot
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const dotLabel = isYes ? neuron.yesLabel : neuron.noLabel;
        const labelX = cx + 16;
        const labelY = cy;
        // Only draw if there's room
        if (labelX + ctx.measureText(dotLabel).width < padding + plotW - 4) {
            ctx.fillStyle = 'rgba(255,251,252,0.88)';
            const tw = ctx.measureText(dotLabel).width;
            ctx.fillRect(labelX - 3, labelY - 8, tw + 6, 16);
            ctx.fillStyle = isYes ? '#4a7d5c' : '#b05578';
            ctx.fillText(dotLabel, labelX, labelY);
        }
    }
}
