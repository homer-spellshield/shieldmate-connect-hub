-- Clear existing skills
DELETE FROM public.skills;

-- Insert comprehensive skills data
INSERT INTO public.skills (name, category, domain, description) VALUES
-- Cyber Security - GRC
('Policy Writing', 'Cyber Security', 'Governance, Risk & Compliance (GRC)', 'Creating and refining security policies, standards, and procedures for an organisation.'),
('Risk Assessment', 'Cyber Security', 'Governance, Risk & Compliance (GRC)', 'Identifying, analysing, and evaluating cyber security risks to an organisation.'),
('Compliance Frameworks', 'Cyber Security', 'Governance, Risk & Compliance (GRC)', 'Assisting with alignment to standards like ISO 27001, Essential Eight, or PCI DSS.'),
('Security Auditing', 'Cyber Security', 'Governance, Risk & Compliance (GRC)', 'Reviewing an organisation''s security controls against a set of established criteria.'),

-- Cyber Security - SecOps
('Incident Response', 'Cyber Security', 'Security Operations (SecOps)', 'Assisting in the preparation for and response to cyber security incidents like breaches or malware attacks.'),
('Log Analysis', 'Cyber Security', 'Security Operations (SecOps)', 'Reviewing system and security logs to identify suspicious activity.'),
('SIEM Management', 'Cyber Security', 'Security Operations (SecOps)', 'Assisting with the setup or tuning of Security Information and Event Management tools.'),
('Threat Hunting', 'Cyber Security', 'Security Operations (SecOps)', 'Proactively searching for signs of malicious activity within an organisation''s network.'),
('Digital Forensics', 'Cyber Security', 'Security Operations (SecOps)', 'Assisting with the basic collection and analysis of digital evidence after an incident.'),

-- Cyber Security - Application Security
('Secure Coding Practices', 'Cyber Security', 'Application Security', 'Providing guidance and training on writing more secure software code.'),
('Web Application Penetration Testing', 'Cyber Security', 'Application Security', 'Actively testing websites and applications to find and report security vulnerabilities.'),
('Code Review', 'Cyber Security', 'Application Security', 'Manually or automatically reviewing source code to identify security flaws.'),

-- Cyber Security - Infrastructure & Network Security
('Firewall Configuration', 'Cyber Security', 'Infrastructure & Network Security', 'Reviewing and recommending improvements for network firewall rules and settings.'),
('Network Security Auditing', 'Cyber Security', 'Infrastructure & Network Security', 'Assessing the security of an organisation''s internal network, including Wi-Fi.'),
('VPN Management', 'Cyber Security', 'Infrastructure & Network Security', 'Assisting with the setup or review of Virtual Private Network (VPN) solutions for secure remote access.'),
('Cloud Security (Azure/AWS/GCP)', 'Cyber Security', 'Infrastructure & Network Security', 'Reviewing and securing cloud infrastructure and services.'),

-- Cyber Security - Endpoint Security
('Endpoint Detection & Response (EDR)', 'Cyber Security', 'Endpoint Security', 'Advising on or assisting with the deployment of advanced endpoint security tools.'),
('Antivirus Management', 'Cyber Security', 'Endpoint Security', 'Ensuring antivirus software is correctly configured, deployed, and updated across all devices.'),
('Mobile Device Management (MDM)', 'Cyber Security', 'Endpoint Security', 'Assisting with policies and tools to secure mobile phones and tablets.'),

-- Cyber Security - Identity & Access Management
('Multi-Factor Authentication (MFA)', 'Cyber Security', 'Identity & Access Management (IAM)', 'Guiding the rollout and implementation of MFA across critical systems.'),
('Single Sign-On (SSO)', 'Cyber Security', 'Identity & Access Management (IAM)', 'Assisting with the planning or implementation of SSO solutions.'),
('Active Directory/Entra ID', 'Cyber Security', 'Identity & Access Management (IAM)', 'Providing support for managing users and permissions in Microsoft environments.'),

-- Cyber Security - Human Risk
('Security Awareness Training', 'Cyber Security', 'Human Risk', 'Developing or delivering training to staff on how to spot and avoid cyber threats.'),
('Phishing Simulation', 'Cyber Security', 'Human Risk', 'Setting up and running controlled phishing tests to gauge staff awareness.'),
('Dark Web Analysis', 'Cyber Security', 'Human Risk', 'Scanning for compromised organisational credentials on the dark web.'),

-- Cyber Security - Data Security
('Data Loss Prevention (DLP)', 'Cyber Security', 'Data Security', 'Assisting with strategies and tools to prevent sensitive data from leaving the organisation.'),
('Encryption', 'Cyber Security', 'Data Security', 'Providing guidance on encrypting data on devices and in transit.'),
('Data Classification', 'Cyber Security', 'Data Security', 'Helping an organisation to identify and label its sensitive information.'),

-- Cyber Security - Vulnerability Management
('Vulnerability Scanning', 'Cyber Security', 'Vulnerability Management', 'Using tools to scan systems and applications for known security weaknesses.'),
('Patch Management', 'Cyber Security', 'Vulnerability Management', 'Establishing a process to ensure software and systems are kept up-to-date.'),

-- Cyber Security - Data Resilience
('Backup & Recovery Strategy', 'Cyber Security', 'Data Resilience', 'Designing and reviewing data backup and disaster recovery plans.'),

-- AI - Strategy & Governance
('AI Strategy', 'Artificial Intelligence (AI)', 'AI Strategy & Governance', 'Helping an organisation identify opportunities to use AI to achieve its goals.'),
('AI Governance', 'Artificial Intelligence (AI)', 'AI Strategy & Governance', 'Creating policies and frameworks for the responsible and ethical use of AI.'),
('AI Ethics', 'Artificial Intelligence (AI)', 'AI Strategy & Governance', 'Advising on the ethical implications of using AI technologies.'),
('Business Analysis', 'Artificial Intelligence (AI)', 'AI Strategy & Governance', 'Analysing business processes to determine suitability for AI solutions.'),
('Data Governance', 'Artificial Intelligence (AI)', 'AI Strategy & Governance', 'Establishing policies for managing and protecting data used in AI systems.'),

-- AI - Implementation
('AI Chatbots', 'Artificial Intelligence (AI)', 'AI Implementation', 'Assisting with the setup and training of customer service or internal support chatbots.'),
('Prompt Engineering', 'Artificial Intelligence (AI)', 'AI Implementation', 'Crafting effective prompts to get the best results from generative AI models.'),
('Natural Language Processing (NLP)', 'Artificial Intelligence (AI)', 'AI Implementation', 'Utilising NLP techniques for tasks like text analysis or summarisation.'),
('API Integration', 'Artificial Intelligence (AI)', 'AI Implementation', 'Connecting AI services to other applications via APIs.'),

-- AI - Automation
('Process Automation', 'Artificial Intelligence (AI)', 'Automation', 'Using tools to automate repetitive, manual business processes.'),
('Workflow Optimisation', 'Artificial Intelligence (AI)', 'Automation', 'Analysing and redesigning workflows for maximum efficiency.'),
('Low-Code/No-Code Platforms', 'Artificial Intelligence (AI)', 'Automation', 'Building simple applications or automations using platforms that require minimal coding.'),

-- IT Support - Cloud Platforms
('Microsoft 365 Admin', 'IT Support & Infrastructure', 'Cloud Platforms', 'Managing users, services, and security within the Microsoft 365 ecosystem.'),
('Google Workspace Admin', 'IT Support & Infrastructure', 'Cloud Platforms', 'Managing users, services, and security within the Google Workspace ecosystem.'),
('Cloud Migration', 'IT Support & Infrastructure', 'Cloud Platforms', 'Planning and executing the move of data and services from on-premise to the cloud.'),
('Cloud Storage (Azure/AWS)', 'IT Support & Infrastructure', 'Cloud Platforms', 'Setting up and managing cloud-based file storage solutions.'),

-- IT Support - System Administration
('Windows Server', 'IT Support & Infrastructure', 'System Administration', 'Managing and maintaining Windows-based server environments.'),
('Linux Administration', 'IT Support & Infrastructure', 'System Administration', 'Managing and maintaining Linux-based server environments.'),
('Virtualisation (VMware/Hyper-V)', 'IT Support & Infrastructure', 'System Administration', 'Managing virtual machines and server virtualisation platforms.'),

-- IT Support - Networking
('Network Troubleshooting', 'IT Support & Infrastructure', 'Networking', 'Diagnosing and resolving network connectivity issues.'),
('Router/Switch Configuration', 'IT Support & Infrastructure', 'Networking', 'Setting up and managing network routers and switches.'),
('Wi-Fi Management', 'IT Support & Infrastructure', 'Networking', 'Designing, securing, and managing wireless networks.'),

-- IT Support - IT Operations
('IT Auditing', 'IT Support & Infrastructure', 'IT Operations', 'Reviewing an organisation''s IT systems and infrastructure against best practices.'),
('Vendor Management', 'IT Support & Infrastructure', 'IT Operations', 'Assisting with the selection and management of IT service providers.'),
('IT Strategy', 'IT Support & Infrastructure', 'IT Operations', 'Helping to develop a long-term technology roadmap for the organisation.'),
('Technical Support', 'IT Support & Infrastructure', 'IT Operations', 'Providing general IT helpdesk and troubleshooting assistance.'),
('Hardware Procurement', 'IT Support & Infrastructure', 'IT Operations', 'Advising on the purchase of new computers, servers, and network equipment.'),

-- IT Support - Data Management
('Database Design', 'IT Support & Infrastructure', 'Data Management', 'Planning and creating the structure for new databases.'),
('SQL', 'IT Support & Infrastructure', 'Data Management', 'Writing and optimising queries for relational databases.'),
('Data Migration', 'IT Support & Infrastructure', 'Data Management', 'Moving data from one system or database to another.'),

-- Web Dev - Frontend
('HTML/CSS', 'Web & Application Development', 'Frontend Development', 'Building the structure and style of web pages.'),
('JavaScript', 'Web & Application Development', 'Frontend Development', 'Adding interactivity and functionality to websites.'),
('React', 'Web & Application Development', 'Frontend Development', 'Developing user interfaces with the React framework.'),
('Angular', 'Web & Application Development', 'Frontend Development', 'Developing user interfaces with the Angular framework.'),
('Vue.js', 'Web & Application Development', 'Frontend Development', 'Developing user interfaces with the Vue.js framework.'),

-- Web Dev - Backend
('Node.js', 'Web & Application Development', 'Backend Development', 'Building server-side applications with JavaScript.'),
('Python (Django/Flask)', 'Web & Application Development', 'Backend Development', 'Building server-side applications with Python.'),
('PHP', 'Web & Application Development', 'Backend Development', 'Developing websites and applications with PHP.'),
('API Development', 'Web & Application Development', 'Backend Development', 'Creating and managing Application Programming Interfaces (APIs).'),

-- Web Dev - UI/UX Design
('UI/UX Design', 'Web & Application Development', 'UI/UX Design', 'Designing the overall look, feel, and user experience of a website or application.'),
('Figma/Adobe XD', 'Web & Application Development', 'UI/UX Design', 'Creating prototypes and design mockups using industry-standard tools.'),
('User Research', 'Web & Application Development', 'UI/UX Design', 'Conducting research to understand user needs and behaviours.'),
('Wireframing', 'Web & Application Development', 'UI/UX Design', 'Creating low-fidelity layouts and blueprints for digital products.'),

-- Web Dev - Website Management
('WordPress/CMS', 'Web & Application Development', 'Website Management', 'Building and managing websites using Content Management Systems like WordPress.'),
('SEO Auditing', 'Web & Application Development', 'Website Management', 'Analysing and improving a website''s visibility on search engines.'),
('Website Performance Optimisation', 'Web & Application Development', 'Website Management', 'Improving the loading speed and responsiveness of a website.'),

-- General - Project Delivery
('Project Management', 'General & Project Skills', 'Project Delivery', 'Planning, executing, and overseeing projects to completion.'),
('Business Analysis', 'General & Project Skills', 'Project Delivery', 'Identifying business needs and determining solutions to business problems.'),
('Project Scoping', 'General & Project Skills', 'Project Delivery', 'Clearly defining the goals, deliverables, and boundaries of a project.'),
('Agile Methodologies', 'General & Project Skills', 'Project Delivery', 'Using iterative development practices like Scrum or Kanban.'),

-- General - Communication & Training
('Technical Writing', 'General & Project Skills', 'Communication & Training', 'Creating clear and concise technical documentation, guides, and instructions.'),
('User Training', 'General & Project Skills', 'Communication & Training', 'Teaching non-technical users how to use software and systems effectively.'),
('Public Speaking', 'General & Project Skills', 'Communication & Training', 'Delivering presentations and workshops to groups.'),
('Communication', 'General & Project Skills', 'Communication & Training', 'Facilitating clear and effective communication between technical and non-technical stakeholders.');