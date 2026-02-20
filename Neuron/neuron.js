class Neuron {
    constructor(config) {
        this.name = config.name;
        this.label = config.label;
        this.yesLabel = config.yesLabel;
        this.noLabel = config.noLabel;
        this.inputs = config.inputs.map(input => ({ ...input }));
        this.bias = config.bias !== undefined ? config.bias : 0;
        this.initialWeights = config.inputs.map(i => i.weight);
        this.initialBias = this.bias;
    }

    sigmoid(z) {
        if (z > 500) return 1;
        if (z < -500) return 0;
        return 1 / (1 + Math.exp(-z));
    }

    forward(inputValues) {
        let z = this.bias;
        for (let i = 0; i < this.inputs.length; i++) {
            z += this.inputs[i].weight * inputValues[i];
        }
        return this.sigmoid(z);
    }

    predict(inputValues) {
        return this.forward(inputValues) >= 0.5;
    }

    train(examples, learningRate = 0.1, epochs = 100) {
        const lossHistory = [];
        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;
            for (const example of examples) {
                const yPred = this.forward(example.inputs);
                const error = example.target - yPred;
                totalLoss += error * error;
                for (let i = 0; i < this.inputs.length; i++) {
                    this.inputs[i].weight += learningRate * error * example.inputs[i];
                }
                this.bias += learningRate * error;
            }
            lossHistory.push(totalLoss / examples.length);
        }
        return lossHistory;
    }

    resetWeights() {
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].weight = this.initialWeights[i];
        }
        this.bias = this.initialBias;
    }

    clone() {
        const config = {
            name: this.name,
            label: this.label,
            yesLabel: this.yesLabel,
            noLabel: this.noLabel,
            inputs: this.inputs.map(i => ({ ...i })),
            bias: this.bias
        };
        return new Neuron(config);
    }
}

const neuron1Config = {
    name: 'neuron1',
    label: 'Should I Host a Meeting?',
    yesLabel: 'HOST THE MEETING',
    noLabel: "DON'T HOST",
    bias: 0.0,
    inputs: [
        {
            key: 'urgency',
            name: 'Urgency',
            icon: '\uD83D\uDD25',
            weight: 2.0,
            minLabel: 'Can wait',
            maxLabel: 'Critical'
        },
        {
            key: 'people',
            name: 'Number of People',
            icon: '\uD83D\uDC65',
            weight: -1.5,
            minLabel: '1-2 people',
            maxLabel: '10+ people'
        },
        {
            key: 'outcome',
            name: 'Potential Outcome',
            icon: '\u2B50',
            weight: 2.5,
            minLabel: 'Low impact',
            maxLabel: 'High impact'
        },
        {
            key: 'preparation',
            name: 'Preparation Needed',
            icon: '\uD83D\uDCCB',
            weight: -1.8,
            minLabel: 'Minimal prep',
            maxLabel: 'Extensive prep'
        }
    ]
};

const neuron2Config = {
    name: 'neuron2',
    label: 'Should It Be Hosted Soon?',
    yesLabel: 'SCHEDULE SOON',
    noLabel: 'SCHEDULE LATER',
    bias: 0.0,
    inputs: [
        {
            key: 'urgency2',
            name: 'Urgency',
            icon: '\uD83D\uDD25',
            weight: 2.0,
            minLabel: 'No time pressure',
            maxLabel: 'Extremely urgent'
        },
        {
            key: 'people2',
            name: 'Number of People',
            icon: '\uD83D\uDC65',
            weight: -1.2,
            minLabel: '1-2 people',
            maxLabel: '10+ people'
        },
        {
            key: 'preparation2',
            name: 'Preparation Needed',
            icon: '\uD83D\uDCCB',
            weight: -1.5,
            minLabel: 'No prep needed',
            maxLabel: 'Significant prep'
        },
        {
            key: 'yourAvailability',
            name: 'Your Availability',
            icon: '\uD83D\uDCC5',
            weight: 1.8,
            minLabel: 'Completely booked',
            maxLabel: 'Highly available'
        },
        {
            key: 'participantAvailability',
            name: 'Participant Availability',
            icon: '\uD83D\uDC65\uD83D\uDCC5',
            weight: 1.8,
            minLabel: 'Hard to coordinate',
            maxLabel: 'Easily available'
        }
    ]
};
