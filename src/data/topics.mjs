export const topics = [
  { id: 'python', name: 'Python', symbol: 'Py', description: 'Write clearer Python. Explore the language, patterns, and tools behind it.', color: 'blue' },
  { id: 'statistics', name: 'Statistics & probability', symbol: 'σ', description: 'Understand uncertainty, test ideas, and make sense of your data.', color: 'purple' },
  { id: 'math-concepts', name: 'Mathematics', symbol: '∑', description: 'Build intuition for the linear algebra, calculus, and optimization behind ML.', color: 'teal' },
  { id: 'data-science', name: 'Data science', symbol: 'ds', description: 'Move from raw data to meaningful features, models, and evaluations.', color: 'orange' },
  { id: 'ml-algorithms', name: 'Machine learning algorithms', symbol: 'ƒ', description: 'Explore how algorithms learn, what they assume, and when to use them.', color: 'purple' },
  { id: 'neural-networks', name: 'Neural networks & LLMs', symbol: 'nn', description: 'Connect the fundamentals of deep learning to transformers and language models.', color: 'blue' },
  { id: 'from-scratch', name: 'Build from scratch', symbol: '</>', description: 'Understand the mechanics by implementing models, algorithms, and applications.', color: 'teal' },
  { id: 'ml-engineering', name: 'ML engineering', symbol: 'ml', description: 'Design practical ML systems, from training pipelines to deployment and monitoring.', color: 'orange' },
  { id: 'data-engineering', name: 'Data engineering', symbol: 'de', description: 'Build reliable data pipelines with SQL, Spark, streaming, and distributed systems.', color: 'blue' },
  { id: 'web-app-concepts', name: 'Web applications', symbol: '{ }', description: 'Connect APIs, authentication, frameworks, and deployment into working applications.', color: 'purple' },
  { id: 'microservices', name: 'Microservices', symbol: 'µ', description: 'Explore service boundaries, communication patterns, and distributed architecture.', color: 'teal' },
  { id: 'interview-questions-library', name: 'System design interviews', symbol: '?', description: 'Practice framing problems, reasoning about tradeoffs, and explaining design decisions.', color: 'orange' },
];

export const paths = [
  { id: 'ml-foundations', title: 'Build your ML foundations', description: 'Start with the mathematics, then connect the ideas to your first models.', concepts: ['linear-algebra', 'probability', 'regression', 'gradient-descent', 'model-evaluation'] },
  { id: 'trust-your-model', title: 'Learn to trust your model', description: 'Understand what a score means and how to spot misleading results.', concepts: ['cross-validation', 'data-leakage', 'overfitting', 'classification-metrics', 'class-imbalance'] },
  { id: 'understand-llms', title: 'Understand language models', description: 'Follow the connections from embeddings to attention and useful LLM applications.', concepts: ['embeddings', 'attention', 'transformers', 'fine-tuning', 'rag', 'ai-agents'] },
  { id: 'python-practice', title: 'Become a more confident Python developer', description: 'Explore the language features that make real programs easier to build.', concepts: ['python-functions', 'object-oriented-programming', 'iterators', 'type-hints', 'concurrency', 'testing'] },
  { id: 'data-to-production', title: 'Take data into production', description: 'Connect data processing, application architecture, and reliable deployment.', concepts: ['sql', 'data-pipelines', 'distributed-systems', 'apis', 'deployment', 'model-drift'] },
];
