class App {
    constructor() {
        this.neuron1 = new Neuron(neuron1Config);
        this.neuron2 = new Neuron(neuron2Config);
        this.activeNeuron = 'neuron1';

        this.sliderValues = {
            neuron1: this.neuron1.inputs.map(() => 0.5),
            neuron2: this.neuron2.inputs.map(() => 0.5)
        };

        this.viz = new DecisionBoundaryViz('decision-canvas');

        this.axisSelection = {
            neuron1: { x: 0, y: 2 },
            neuron2: { x: 0, y: 3 }
        };

        this.init();
    }

    init() {
        this.setupNeuronCards();
        this.renderSliders();
        this.renderAxisSelectors();
        this.renderDecision();
        this.updateVisualization();

        this.viz.onPointMoved = (xIdx, xVal, yIdx, yVal) => {
            this.sliderValues[this.activeNeuron][xIdx] = xVal;
            this.sliderValues[this.activeNeuron][yIdx] = yVal;
            this.renderSliders();
            this.renderDecision();
            this.updateVisualization();
        };

        window.addEventListener('resize', () => this.updateVisualization());
    }

    getCurrentNeuron() {
        return this.activeNeuron === 'neuron1' ? this.neuron1 : this.neuron2;
    }

    setupNeuronCards() {
        document.querySelectorAll('.neuron-card').forEach(card => {
            card.addEventListener('click', () => {
                const neuronKey = card.dataset.neuron === '1' ? 'neuron1' : 'neuron2';

                if (neuronKey === 'neuron2') {
                    const n1Output = this.neuron1.forward(this.sliderValues.neuron1);
                    if (n1Output < 0.5) return;
                }

                this.activeNeuron = neuronKey;
                document.querySelectorAll('.neuron-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                this.renderSliders();
                this.renderAxisSelectors();
                this.updateVisualization();
            });
        });
    }

    getSliderLabel(value) {
        if (value <= 0.2) return 'Very Low';
        if (value <= 0.4) return 'Low';
        if (value <= 0.6) return 'Medium';
        if (value <= 0.8) return 'High';
        return 'Very High';
    }

    getConfidenceLabel(output) {
        const pct = Math.round(Math.abs(output - 0.5) * 200);
        if (pct >= 80) return 'Very confident';
        if (pct >= 50) return 'Fairly confident';
        if (pct >= 20) return 'Leaning';
        return 'On the fence';
    }

    renderSliders() {
        const container = document.getElementById('sliders-container');
        const neuron = this.getCurrentNeuron();
        const values = this.sliderValues[this.activeNeuron];

        if (container.dataset.neuron !== this.activeNeuron) {
            container.dataset.neuron = this.activeNeuron;
            container.innerHTML = '';

            neuron.inputs.forEach((input, i) => {
                const group = document.createElement('div');
                group.className = 'slider-group';

                group.innerHTML = `
                    <div class="slider-header">
                        <span class="slider-label">${input.icon} ${input.name}</span>
                        <span class="slider-value" id="val-${i}">${this.getSliderLabel(values[i])}</span>
                    </div>
                    <div class="slider-track">
                        <input type="range" min="0" max="1" step="0.01"
                               value="${values[i]}"
                               id="slider-${i}">
                    </div>
                    <div class="slider-endpoints">
                        <span>${input.minLabel}</span>
                        <span>${input.maxLabel}</span>
                    </div>
                `;

                const slider = group.querySelector('input[type="range"]');
                slider.addEventListener('input', () => {
                    const val = parseFloat(slider.value);
                    this.sliderValues[this.activeNeuron][i] = val;
                    group.querySelector('.slider-value').textContent = this.getSliderLabel(val);
                    this.renderDecision();
                    this.updateVisualization();
                });

                container.appendChild(group);
            });
        } else {
            neuron.inputs.forEach((input, i) => {
                const slider = document.getElementById(`slider-${i}`);
                const valDisplay = document.getElementById(`val-${i}`);
                if (slider && valDisplay) {
                    slider.value = values[i];
                    valDisplay.textContent = this.getSliderLabel(values[i]);
                }
            });
        }
    }

    renderAxisSelectors() {
        const neuron = this.getCurrentNeuron();
        const sel = this.axisSelection[this.activeNeuron];

        const xSelect = document.getElementById('x-axis-select');
        const ySelect = document.getElementById('y-axis-select');

        xSelect.innerHTML = '';
        ySelect.innerHTML = '';

        neuron.inputs.forEach((input, i) => {
            xSelect.add(new Option(`${input.icon} ${input.name}`, i));
            ySelect.add(new Option(`${input.icon} ${input.name}`, i));
        });

        xSelect.value = sel.x;
        ySelect.value = sel.y;

        xSelect.onchange = () => {
            this.axisSelection[this.activeNeuron].x = parseInt(xSelect.value);
            if (this.axisSelection[this.activeNeuron].x === this.axisSelection[this.activeNeuron].y) {
                const alt = neuron.inputs.findIndex((_, i) => i !== parseInt(xSelect.value));
                this.axisSelection[this.activeNeuron].y = alt;
                ySelect.value = alt;
            }
            this.updateVisualization();
        };

        ySelect.onchange = () => {
            this.axisSelection[this.activeNeuron].y = parseInt(ySelect.value);
            if (this.axisSelection[this.activeNeuron].y === this.axisSelection[this.activeNeuron].x) {
                const alt = neuron.inputs.findIndex((_, i) => i !== parseInt(ySelect.value));
                this.axisSelection[this.activeNeuron].x = alt;
                xSelect.value = alt;
            }
            this.updateVisualization();
        };
    }

    renderDecision() {
        const v1 = this.sliderValues.neuron1;
        const output1 = this.neuron1.forward(v1);
        const decision1 = output1 >= 0.5;

        const card1 = document.getElementById('decision-1');
        const result1 = document.getElementById('result-1');
        const conf1 = document.getElementById('confidence-1');

        const prevClass1 = card1.className;
        const newClass1 = `decision-card ${decision1 ? 'yes' : 'no'}`;
        card1.className = newClass1;

        if (prevClass1 !== newClass1 && prevClass1 !== 'decision-card') {
            card1.classList.add('pop');
            setTimeout(() => card1.classList.remove('pop'), 400);
        }

        result1.textContent = decision1 ? '\u2714 HOST THE MEETING' : '\u2718 DON\'T HOST';
        const confLabel1 = this.getConfidenceLabel(output1);
        const confPct1 = Math.round(output1 * 100);
        conf1.innerHTML = `<span class="confidence-text">${confLabel1}</span>
            <div class="confidence-bar"><div class="confidence-fill" style="width:${confPct1}%"></div></div>`;

        const card2 = document.getElementById('decision-2');
        const result2 = document.getElementById('result-2');
        const conf2 = document.getElementById('confidence-2');

        const neuron2Card = document.querySelector('.neuron-card[data-neuron="2"]');
        const neuron2Status = neuron2Card.querySelector('.neuron-status');

        if (!decision1) {
            card2.className = 'decision-card disabled';
            result2.textContent = '--';
            conf2.innerHTML = 'Waiting for first decision...';
            neuron2Card.classList.add('disabled');
            neuron2Status.textContent = 'Inactive';
            neuron2Status.classList.remove('active');

            if (this.activeNeuron === 'neuron2') {
                this.activeNeuron = 'neuron1';
                document.querySelectorAll('.neuron-card').forEach(c => c.classList.remove('active'));
                document.querySelector('.neuron-card[data-neuron="1"]').classList.add('active');
                this.renderSliders();
                this.renderAxisSelectors();
                this.updateVisualization();
            }
        } else {
            neuron2Card.classList.remove('disabled');
            neuron2Status.textContent = 'Active';
            neuron2Status.classList.add('active');

            const v2 = this.sliderValues.neuron2;
            const output2 = this.neuron2.forward(v2);
            const decision2 = output2 >= 0.5;

            const prevClass2 = card2.className;
            const newClass2 = `decision-card ${decision2 ? 'yes' : 'no'}`;
            card2.className = newClass2;

            if (prevClass2 !== newClass2 && prevClass2 !== 'decision-card disabled') {
                card2.classList.add('pop');
                setTimeout(() => card2.classList.remove('pop'), 400);
            }

            result2.textContent = decision2 ? '\u26A1 SCHEDULE SOON' : '\uD83D\uDCC5 SCHEDULE LATER';
            const confLabel2 = this.getConfidenceLabel(output2);
            const confPct2 = Math.round(output2 * 100);
            conf2.innerHTML = `<span class="confidence-text">${confLabel2}</span>
                <div class="confidence-bar"><div class="confidence-fill" style="width:${confPct2}%"></div></div>`;
        }
    }

    updateVisualization() {
        const neuron = this.getCurrentNeuron();
        const values = this.sliderValues[this.activeNeuron];
        const sel = this.axisSelection[this.activeNeuron];
        this.viz.render(neuron, sel.x, sel.y, values);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
