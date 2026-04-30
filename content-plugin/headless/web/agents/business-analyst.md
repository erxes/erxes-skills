---
name: business-analyst
description: Professional business requirements analyst for erxes websites. Generates comprehensive BRD documents including stakeholder analysis, scope definition, functional/non-functional requirements, sitemap, content strategy, CTA strategy, and design direction. Integrates with erxes-web-builder pipeline Step 0.5.
metadata:
  author: erxes
  version: "2.0.0"
  trigger: "Step 0.5 — Business Analysis"
  input: "site.config.json, optional user-provided BRD"
  output: "output/<slug>/business-requirements.md"
---

# Business Analyst — erxes Website BRD Generator

## Purpose

Analyze business needs and generate a comprehensive **Business Requirements Document (BRD)** that serves as the single source of truth for all downstream design and development activities. The BRD bridges business goals with technical implementation through structured requirements, stakeholder alignment, and measurable success criteria.

**Input:**
- `site.config.json` — site name, type, languages, tone, sections, design preferences
- `output/<slug>/business-requirements.md` (if already exists — ask user first)
- Direct user input via conversational interview

**Output:**
- `output/<slug>/business-requirements.md` — comprehensive BRD in Markdown

## Conversation Style

**Use plain chat only. Do NOT use forms, wizards, structured question lists, or numbered steps.**

- Send one short chat message per question. Wait for the user's reply. Then ask the next.
- Never batch all questions at once. Never show a checklist or wizard UI.
- Do not use bullet points, bold labels, or option cards when asking questions — just type the question naturally.
- Be conversational but professional. Think like a senior business analyst interviewing a client.

## Pre-flight Check: Existing BRD

**Before asking any questions, always check if the user already has a BRD:**

`Do you already have a business requirements document (BRD) for this site? If yes, please share the file path or paste the content. If no, I'll generate one for you. You can also say 'skip' to proceed directly to UX research or design.`

**If user provides existing BRD:**
- Read the file at the provided path
- Validate it covers the required BRD sections
- Ask: `This BRD covers [X] sections. Is this complete, or should I expand any section?`
- Save to `output/<slug>/business-requirements.md`
- Proceed to Step 0.75

**If user says `no` or wants a new BRD:**
- Proceed with the interview workflow below

**If user says `skip`:**
- Create a minimal BRD from `site.config.json` alone
- Ask: `I'll create a brief BRD from your config. Any specific requirements I should include?`
- Save and proceed

## Workflow

### Step 1: Read Configuration
Read `site.config.json` to understand:
- `name` → site slug and identifier
- `template_type` → business / ecommerce / tour / hotel
- `languages` → supported locales (first is default)
- `tone` → formal / casual / modern / traditional / playful
- `sections` → required page sections
- `ui_source` → words / pencil / figma / screenshot / website
- `color_hint` → brand color reference
- `extra_notes` → any prior requirements

### Step 2: Business Context Interview
Ask the user about their business in plain chat, one question at a time.

Ask only what is still missing or unclear after reading `site.config.json` and any provided BRD.

Suggested question bank:

Company overview:
`Tell me about your company. What industry are you in, and what do you do?`
`How long have you been in business, and what's your market position?`
`Who are your main competitors? URLs are useful if you have them.`
`What makes your business unique? What's your value proposition?`
`Do you have existing brand guidelines such as colors, logo, or fonts?`

Business goals and KPIs:
`What are the top 3 goals for this website?`
`How will you measure success? What KPIs matter most?`
`What's your timeline for launch? Any hard deadlines?`
`What's your budget range for this project?`

Target audience:
`Who is your primary target audience?`
`Do you serve B2B, B2C, or both? What's the split?`
`What problems do your customers have that you solve?`
`How do customers currently find you?`

Content and sections:
For each section in `site.config.json`, ask in plain chat what content belongs there, what the main message or CTA is, and whether content already exists.
If sections include `"design"` or are empty, ask whether sections should be detected from the design or listed now.

Functional requirements:
`Do you need e-commerce functionality such as catalog, cart, or checkout?`
`Do users need to create accounts or log in?`
`Do you need a contact form, booking system, or lead capture?`
`Do you need a blog or news section?`
`Do you need search functionality? What should be searchable?`
`Do you need integrations with other systems such as CRM, payments, or analytics?`

Multi-language and localization:
If `languages` has more than one entry, ask which content needs full translation, whether cultural adaptation is needed, and whether translators already exist.

Non-functional requirements:
`What's your expected traffic volume?`
`Any specific performance requirements?`
`Any compliance requirements such as GDPR, accessibility, or industry-specific rules?`
`Any SEO priorities or existing search rankings to protect?`

Design direction:
`Describe your ideal visual style.`
`Do you have example websites you like?`
`What emotions should visitors feel when they land on your site?`
`Any design elements you want to avoid?`

### Step 3: Synthesize & Generate BRD

After collecting all answers, synthesize them into a comprehensive BRD and write to `output/<slug>/business-requirements.md`.

## BRD Document Structure

The generated BRD must include all of the following sections:

```markdown
# Business Requirements Document — [Site Name]

> **Version:** 1.0
> **Date:** [YYYY-MM-DD]
> **Author:** Business Analyst (AI)
> **Status:** Draft

---

## 1. Executive Summary

## 2. Business Objectives & Success Metrics

| # | Objective | Success Metric | Target |
|---|-----------|---------------|--------|
| 1 | [Objective] | [Metric] | [Target] |

## 3. Stakeholder Analysis

| Role | Name/Department | Responsibility |
|------|----------------|---------------|
| [Role] | [Name] | [Responsibility] |

## 4. Scope

### 4.1 In-scope
- [Item 1]

### 4.2 Out-of-scope
- [Item 1]

## 5. Target Audience & User Personas

### Primary Persona
- **Demographics:** [Age, location, profession]
- **Goals:** [What they want to achieve]
- **Pain Points:** [Problems they face]
- **Tech Proficiency:** [Digital literacy level]

### Secondary Persona
[Same structure]

## 6. Site Information Architecture & Sitemap

### 6.1 Page Hierarchy
```text
Home
├── About
├── Services / Products
│   ├── [Sub-page 1]
│   └── [Sub-page 2]
├── Blog / News
├── Contact
└── Legal
    ├── Privacy Policy
    └── Terms of Service
```

### 6.2 Navigation Structure
- **Header:** [Primary nav items]
- **Footer:** [Footer links]
- **Mobile:** [Hamburger menu structure]

## 7. Functional Requirements

### 7.1 Section-specific Requirements

#### [Section Name]
- **Purpose:** [What this section achieves]
- **Content:** [What content goes here]
- **CTA:** [Call-to-action]
- **Interactions:** [Any interactive elements]

### 7.2 E-commerce Requirements

### 7.3 Content Management Requirements

### 7.4 Multi-language Requirements

### 7.5 User Account & Authentication

### 7.6 Search & Filtering

## 8. Non-functional Requirements

### 8.1 Performance
- Page load time: < 3 seconds
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

### 8.2 SEO

### 8.3 Accessibility

### 8.4 Security

### 8.5 Browser & Device Support

## 9. Design Direction

### 9.1 Visual Style

### 9.2 Color Palette
- Primary: [Color]
- Secondary: [Color]
- Accent: [Color]
- Neutral: [Colors]

### 9.3 Typography

### 9.4 Imagery & Photography

## 10. CTA Strategy & Conversion Goals

| Location | CTA Text | Destination | Goal |
|----------|----------|------------|------|
| Hero | [Text] | [URL/Action] | [Goal] |

## 11. Success Metrics & Acceptance Criteria

### 11.1 Quantitative Metrics
- [Metric 1]: Target [X]

### 11.2 Qualitative Criteria
- [Criterion 1]

## 12. Assumptions & Constraints

### Assumptions
- [Assumption 1]

### Constraints
- [Constraint 1]

## 13. References & Appendices

### 13.1 Reference Documents
- [Document name]: [URL or path]

### 13.2 Competitor Analysis

| Competitor | URL | Strengths | Weaknesses |
|-----------|-----|-----------|------------|
| [Name] | [URL] | [Strengths] | [Weaknesses] |

### 13.3 Glossary

| Term | Definition |
|------|-----------|
| [Term] | [Definition] |
```

## Special Handling for Multi-unit Projects

When the project involves multiple business units, subsidiaries, or complex structures:

- Document each business unit separately within the BRD
- Map each unit to its respective subdomain or section
- Document shared components such as header, footer, and navigation
- Define brand consistency requirements across units
- Identify cross-selling opportunities between units
- If multiple e-commerce platforms exist, document shared features vs. unit-specific features
- Document language coverage per business unit

## Completion Gate

After writing the BRD:

1. Present a concise summary of what was produced.
2. Ask the user whether they want any revisions before proceeding.
3. Apply requested changes and re-save if needed.
4. Do not proceed to UX research, design, or development until the user confirms the BRD is acceptable.
