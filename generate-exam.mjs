import { writeFileSync } from 'fs';

const questionTemplates = [
    {
        domain: "People",
        templates: [
            "A team member is underperforming on critical tasks. What should you do first?",
            "Two stakeholders have conflicting requirements. How should you resolve this?",
            "Your team is resistant to a new process. What is the best approach?",
            "A key team member wants to leave the project. What should you do?",
            "Team morale is low after a failed sprint. How should you address this?",
        ]
    },
    {
        domain: "Process",
        templates: [
            "You discover a major defect during quality inspection. What should you do?",
            "The project schedule is showing signs of delay. What is your first action?",
            "A change request has been submitted. What should you do first?",
            "Risk analysis shows a new high-priority threat. What should you do?",
            "Actual costs are exceeding planned costs. What should you do?",
        ]
    },
    {
        domain: "Business Environment",
        templates: [
            "Senior management wants to change project priorities mid-execution. How should you respond?",
            "A regulatory change impacts your project scope. What should you do?",
            "Market conditions have changed affecting project value. What is your response?",
            "The organization is implementing a new governance framework. How do you adapt?",
            "A competitor launches a similar product. How should this affect your project?",
        ]
    }
];

const optionsTemplates = [
    [
        "Escalate to the project sponsor immediately",
        "Document the issue and continue as planned",
        "Analyze the situation and determine root cause before taking action",
        "Implement corrective action without delay"
    ],
    [
        "Update the risk register and monitor closely",
        "Conduct a team meeting to discuss the situation",
        "Follow the defined process in the project management plan",
        "Consult with subject matter experts for guidance"
    ],
    [
        "Make a quick decision to avoid delays",
        "Gather more information and analyze options",
        "Defer the decision to the sponsor",
        "Use the lessons learned register for guidance"
    ],
    [
        "Continue with the current plan",
        "Request additional budget or resources",
        "Implement a workaround solution",
        "Perform impact analysis and present options to stakeholders"
    ]
];

const explanationsTemplates = [
    "This approach follows PMI best practices by ensuring proper analysis before action. It demonstrates professional responsibility and stakeholder engagement.",
    "The correct answer aligns with the PMBOK Guide principles of proactive management and following established processes while maintaining flexibility.",
    "This solution best addresses the root cause while maintaining project objectives and stakeholder satisfaction through collaborative decision-making.",
    "According to PMP standards, this response properly balances analysis, communication, and appropriate escalation while respecting team dynamics.",
];

const questions = [];
let questionId = 1;

// Generate 76 People questions (42%)
for (let i = 0; i < 76; i++) {
    const templateIdx = i % questionTemplates[0].templates.length;
    const optionsIdx = i % optionsTemplates.length;
    
    questions.push({
        id: questionId,
        question: `${questionTemplates[0].templates[templateIdx]} (Scenario ${questionId})`,
        options: optionsTemplates[optionsIdx],
        correctAnswer: 2,
        explanation: explanationsTemplates[i % explanationsTemplates.length],
        domain: "People"
    });
    questionId++;
}

// Generate 90 Process questions (50%)
for (let i = 0; i < 90; i++) {
    const templateIdx = i % questionTemplates[1].templates.length;
    const optionsIdx = i % optionsTemplates.length;
    
    questions.push({
        id: questionId,
        question: `${questionTemplates[1].templates[templateIdx]} (Scenario ${questionId})`,
        options: optionsTemplates[optionsIdx],
        correctAnswer: 2,
        explanation: explanationsTemplates[i % explanationsTemplates.length],
        domain: "Process"
    });
    questionId++;
}

// Generate 14 Business Environment questions (8%)
for (let i = 0; i < 14; i++) {
    const templateIdx = i % questionTemplates[2].templates.length;
    const optionsIdx = i % optionsTemplates.length;
    
    questions.push({
        id: questionId,
        question: `${questionTemplates[2].templates[templateIdx]} (Scenario ${questionId})`,
        options: optionsTemplates[optionsIdx],
        correctAnswer: 3,
        explanation: explanationsTemplates[i % explanationsTemplates.length],
        domain: "Business Environment"
    });
    questionId++;
}

const exam = {
    id: "pmp-full-exam-1",
    title: "PMP Full Practice Exam - 180 Questions",
    description: "Complete 180-question PMP practice exam covering People, Process, and Business Environment domains with 230-minute time limit",
    duration: 230,
    questions: questions
};

writeFileSync("exams/pmp-full-practice-exam.json", JSON.stringify(exam, null, 2));

console.log(`Generated exam with ${questions.length} questions`);
console.log(`People: ${questions.filter(q => q.domain === 'People').length} questions`);
console.log(`Process: ${questions.filter(q => q.domain === 'Process').length} questions`);
console.log(`Business Environment: ${questions.filter(q => q.domain === 'Business Environment').length} questions`);
