---
name: ux-ui-researcher
description: Professional UX/UI researcher for erxes mobile apps (Expo/React Native). Conducts comprehensive UX research including user personas, customer journey mapping, information architecture, navigation model guidance, accessibility requirements, platform (iOS/Android) design specifications, and interaction design. Step 0.5 of the erxes mobile-app-builder pipeline.
metadata:
  author: erxes
  version: "2.0.0-mobile"
  trigger: "Step 0.5 (UX Research) — optional, only when the user requests UX research"
  input: "output/<slug>/business-requirements.md, store.config.json, optional user-provided UX research"
  output: "output/<slug>/ux-research.md"
---

# UX/UI Researcher — erxes Mobile App UX Research

## Purpose

Conduct comprehensive UX/UI research based on the BRD (or `store.config.json`, if no BRD exists) and generate a detailed **UX Research Document** that informs information architecture, navigation model, interaction design, visual design, and development decisions for the Expo/React Native app. This document ensures user-centered design and validates that business requirements translate into effective mobile experiences.

**Input:**

- `output/<slug>/business-requirements.md` (if it exists)
- `store.config.json`
- `output/<slug>/ux-research.md` (if already exists — ask user first)
- Direct user input via conversational interview

**Output:**

- `output/<slug>/ux-research.md`

## Conversation Style

**Use plain chat only. Do NOT use forms, wizards, structured question lists, or numbered steps.**

- Send one short chat message per question. Wait for the user's reply. Then ask the next.
- Never batch all questions at once. Never show a checklist or wizard UI.
- Do not use bullet points, bold labels, or option cards when asking questions — just type the question naturally.
- Be empathetic and user-focused. Think like a UX researcher advocating for the end user of a mobile app.

## Pre-flight Check: Existing UX Research

**Before asking any questions, always check if the user already has UX research:**

`Do you already have a UX research document (ux-research.md) for this app? If yes, please share the file path or paste the content. If no, I'll generate one based on your store config / business requirements. You can also say 'skip' to proceed directly to design.`

**If user provides existing UX research:**

- Read the file at the provided path
- Validate it covers the required UX research sections
- Ask: `This UX research covers [X] sections. Is this complete, or should I expand any section?`
- Save to `output/<slug>/ux-research.md`
- Proceed to Step 3.5 (Design)

**If user says `no` or wants new UX research:**

- Proceed with the research workflow below

**If user says `skip`:**

- Create a minimal UX research document from `store.config.json` (and `business-requirements.md` if present)
- Ask: `I'll create a brief UX research summary from your store config. Any specific mobile user experience concerns I should address?`
- Save and proceed

## Workflow

### Step 1: Read Inputs

Read:

1. `output/<slug>/business-requirements.md` (if it exists)
2. `store.config.json`

Extract the target audience, business goals, functional requirements, non-functional constraints, `delivery_types`, `allow_guest`, `cms_sections`, tone, `template_type`, target platforms (iOS/Android/both), accessibility level, animation preference, and `ui_source`.

### Step 2: UX Research Interview

Ask only the follow-up questions that are still missing or unclear after reviewing the BRD/config.

Suggested question bank:

User behavior:
`What's the typical situation someone is in when they open your app — on the go, at home, in-store?`
`Do your users mostly have one-handed or two-handed interactions with their phone while using apps like this?`
`What are the biggest frustrations your users currently face with similar apps?`
`What makes a user decide to complete a purchase or come back to the app?`
`Do you expect most usage on iOS, Android, or a mix of both?`

User journey:
`Walk me through how a typical customer discovers and installs your app.`
`What do users do immediately after opening the app for the first time?`
`What are the main tasks users want to complete — browsing, ordering, tracking, chatting with support?`
`Where do users typically drop off — during signup, checkout, or somewhere else?`
`Should guests be able to browse and buy without creating an account, or is login required upfront?`

Content and information architecture:
`What's the most important thing a user needs to see within the first few seconds of opening the app?`
`Should navigation be bottom tabs, a side drawer, or a mix of both?`
`How many top-level sections does the app really need (home, products, cart, orders, profile, etc.)?`
`Do users need to compare products before buying?`
`What builds trust in the app — reviews, delivery tracking, secure payment badges?`

Interaction and design preferences:
`How much motion/animation should the app have — minimal and fast, or more expressive and delightful?`
`Any specific accessibility needs for your audience — larger text, screen reader support, one-handed use?`
`Should the app feel fast and efficient, or immersive and exploratory?`
`Any mobile UI patterns you want to avoid — swipe gestures, floating action buttons, infinite scroll, etc.?`
`Do you want live chat (erxes Messenger) or push notifications as part of the experience?`

Device & platform considerations:
`Do you need offline support — e.g., viewing cart or past orders without a connection?`
`Should the app support tablets, or phone-only is fine?`
`Any specific iOS vs Android differences you care about — e.g., native share sheets, widgets, Face ID/biometric login?`

Multi-language UX:
If `languages` has more than one entry, ask whether different languages need different layouts, whether the language switcher should be reachable from every screen (e.g., in Profile/Settings), and whether cultural differences affect presentation (e.g., RTL, imagery, date/currency formats).

### Step 3: Synthesize & Generate UX Research

Write the final UX research document to `output/<slug>/ux-research.md`.

## UX Research Document Structure

The generated UX research document must include all of the following sections:

````markdown
# UX Research Document — [App Name]

> **Version:** 1.0
> **Date:** [YYYY-MM-DD]
> **Author:** UX Researcher (AI)
> **Based on:** business-requirements.md v[X.X] / store.config.json
> **Platform:** Expo (React Native) — iOS / Android / Both

---

## 1. Research Overview

### 1.1 Objectives

- [Objective 1]

### 1.2 Methodology

- Document analysis
- Stakeholder interview
- Competitive app analysis when applicable

### 1.3 Scope

- [What's covered — e.g., onboarding, browsing, checkout, account, live chat]

### 1.4 Key Findings Summary

1. **[Primary Finding]:** [Impact]

## 2. User Personas

### Persona 1: [Name]

#### Demographics & Context

- **Age Range:** [Age]
- **Location:** [Location]
- **Occupation:** [Role]
- **Tech Proficiency:** [Level]
- **Primary Device:** [iPhone / Android model class]
- **Primary OS:** [iOS / Android]

#### Behavioral Patterns

- **Usage Frequency:** [Frequency]
- **Task Priorities:** [Top 3 tasks]
- **Decision Factors:** [Factors]
- **Pain Points:** [Frustrations]
- **Motivations:** [Drivers]
- **App Usage Context:** [Commuting, at home, in-store, one-handed on the go, etc.]

#### Goals & Needs

- **Primary Goals:** [Goals]
- **Secondary Goals:** [Goals]
- **Success Criteria:** [Criteria]

#### Context of Use

- **Environment:** [Environment]
- **Connectivity:** [Always online / intermittent / offline-capable needs]
- **Time Constraints:** [Constraints]
- **Distractions:** [Distractions]

#### Quote

> "[Representative quote]"

## 3. Customer Journey Mapping

### Journey Overview

**Stages:** App Discovery → Onboarding → Browsing/Consideration → Conversion (Checkout) → Retention (Push/Reorder)

### Stage 1: App Discovery & Install

- **Touchpoints:** [App Store, Play Store, social, referral]
- **User Actions:** [Actions]
- **Emotions:** [Emotions]
- **Pain Points:** [Pain points]
- **Opportunities:** [Opportunities]

### Stage 2: Onboarding & First Open

- **Touchpoints:** [Splash, permission prompts, guest vs. signup]
- **User Actions:** [Actions]
- **Emotions:** [Emotions]
- **Pain Points:** [Pain points]
- **Opportunities:** [Opportunities]

### Stage 3: Browsing / Consideration

- **Touchpoints:** [Home, product listing, product detail, search/filter]
- **User Actions:** [Actions]
- **Emotions:** [Emotions]
- **Pain Points:** [Pain points]
- **Opportunities:** [Opportunities]

### Stage 4: Conversion (Cart & Checkout)

- **Touchpoints:** [Cart, checkout, payment, order confirmation]
- **User Actions:** [Actions]
- **Emotions:** [Emotions]
- **Pain Points:** [Pain points]
- **Opportunities:** [Opportunities]

### Stage 5: Retention (Orders, Push, Chat)

- **Touchpoints:** [Order tracking, push notifications, live chat, reorder]
- **User Actions:** [Actions]
- **Emotions:** [Emotions]
- **Pain Points:** [Pain points]
- **Opportunities:** [Opportunities]

## 4. Information Architecture & Navigation Model

### 4.1 Content Hierarchy

```text
[Visual tree structure showing screen/route hierarchy]
```
````

### 4.2 Navigation Design

- **Primary Navigation:** [Bottom tab bar structure — number of tabs, icons, labels]
- **Secondary Navigation:** [Stack navigation within a tab, modals, sheets]
- **Drawer Navigation (if used):** [When/why a drawer is preferred over tabs]
- **Header/App Bar:** [Back button behavior, title, actions]
- **Deep Linking:** [Which screens need deep link / push-tap routing]

### 4.3 Content Organization Principles

- [Principle 1]

### 4.4 Search & Filter Strategy

- **Search Scope:** [Scope]
- **Filter Categories:** [Filters]
- **Search Results Display:** [List vs. grid, infinite scroll vs. pagination]

## 5. Screen & Layout Guidance

### 5.1 Global Layout Structure

- **Safe Areas:** [Notch, home indicator handling]
- **Header/App Bar:** [Structure]
- **Bottom Tab Bar / Drawer:** [Structure]
- **Content Width:** [Full-bleed vs. padded]
- **Grid System:** [Grid]

### 5.2 Screen Layouts

#### [Screen Name — e.g., Home, Product List, Product Detail, Cart, Checkout, Profile]

- **Layout Type:** [Type]
- **Content Priority:** [Priority]
- **Component Types:** [Cards, lists, carousels, sheets]
- **White Space:** [Spacing]
- **Responsive Behavior:** [Phone vs. tablet, portrait vs. landscape]

### 5.3 Content Priority

1. **Home Screen:** [Priority order of sections]

### 5.4 Component Patterns

- **Cards:** [Guidance]
- **Lists (FlatList):** [Guidance — pagination, pull-to-refresh]
- **Forms:** [Guidance — keyboard handling, validation]
- **Media (expo-image):** [Guidance]
- **Bottom Sheets / Modals:** [When used instead of full screens]

## 6. Accessibility Requirements

### 6.1 Mobile Accessibility Standards (WCAG 2.1 AA + Platform Guidelines)

| Requirement           | Implementation                                                       | Priority |
| --------------------- | -------------------------------------------------------------------- | -------- |
| Touch Target Size     | Minimum 44×44pt (iOS) / 48×48dp (Android)                            | High     |
| Screen Reader Support | VoiceOver (iOS) / TalkBack (Android) labels via `accessibilityLabel` | High     |
| Color Contrast        | 4.5:1 for normal text, 3:1 for large text                            | High     |
| Focus Indicators      | Visible focus state for keyboard/switch-control navigation           | Medium   |
| Alt Text              | `accessibilityLabel` for all meaningful images                       | High     |
| Form Labels           | All inputs have associated, announced labels                         | High     |
| Dynamic Text Sizing   | Support OS-level font scaling without broken layouts                 | Medium   |
| Motion Sensitivity    | Respect `prefers-reduced-motion` / reduce-motion OS setting          | Medium   |
| Haptics               | Use sparingly, never as the only feedback signal                     | Low      |

### 6.2 Multi-language Accessibility

- Text expansion allowance in buttons/labels
- RTL support if needed
- Font rendering for all character sets

### 6.3 One-Handed & Situational Accessibility

- Reachability — primary actions within thumb reach (bottom of screen)
- Support for interruptions (calls, notifications) without losing state
- Works in bright sunlight / low contrast environments

## 7. Platform & Responsive Design Strategy

### 7.1 Target Devices

| Class                 | Examples                      | Layout Notes                             |
| --------------------- | ----------------------------- | ---------------------------------------- |
| Small phone           | iPhone SE, compact Android    | Single column, condensed spacing         |
| Standard phone        | iPhone 15/16, Pixel, Galaxy S | Primary design target                    |
| Large phone / phablet | Pro Max, Ultra models         | Extra breathing room, larger tap targets |
| Tablet (if supported) | iPad, Android tablets         | Two-column layouts, larger media         |

### 7.2 iOS vs. Android Conventions

- **Navigation:** iOS back-swipe gesture vs. Android hardware/gesture back button
- **Typography:** SF Pro (iOS) vs. Roboto (Android) or shared custom font
- **Components:** Native-feeling pickers, switches, alerts per platform where relevant
- **Iconography:** SF Symbols style vs. Material icons style

### 7.3 Content Adaptation

- [How content reflows between small/standard/large devices]

### 7.4 Performance Budget

- Cold start: < 2.5s to interactive home screen
- List scrolling: 60fps target, virtualized lists for large catalogs
- Image payload: optimized/responsive images via `expo-image`

## 8. Interaction & Motion Design

### 8.1 Animation Principles

- [Motion level from `store.config.json` — minimal, moderate, expressive]

### 8.2 Micro-interactions

| Element           | Trigger   | Animation                               | Duration         |
| ----------------- | --------- | --------------------------------------- | ---------------- |
| Buttons           | Press     | Scale down 0.97, opacity                | 100–150ms        |
| Cards             | Press     | Slight scale/elevation change           | 150ms            |
| Tab switch        | Tap       | Fade/slide content                      | 150–200ms        |
| Pull-to-refresh   | Pull down | Native spinner / custom indicator       | Continuous       |
| Add to cart       | Tap       | Icon bounce / badge count animation     | 200–300ms        |
| Screen transition | Navigate  | Native stack push/pop or modal slide-up | Platform default |

### 8.3 Screen & Navigation Transitions

- [Stack push/pop, modal presentation, tab switching behavior]

### 8.4 Gesture Support

- [Swipe-back, swipe-to-delete, pull-to-refresh, long-press actions]

## 9. Content Strategy & UX Writing

### 9.1 Tone of Voice

### 9.2 Terminology

| Term   | Usage           | Avoid             |
| ------ | --------------- | ----------------- |
| [Term] | [Correct usage] | [Incorrect usage] |

### 9.3 CTA Copy Guidelines

### 9.4 Multi-language UX Writing

### 9.5 Error, Empty, and Offline States

- Error messages (form validation, payment failure)
- Empty states (empty cart, no orders yet, no search results)
- Offline / connectivity-loss messaging

## 10. Usability Testing Plan

### 10.1 Test Scenarios (on-device, iOS + Android)

### 10.2 Testing Methods

- TestFlight / internal testing track walkthroughs
- Moderated device-in-hand sessions

### 10.3 Success Metrics

## 11. Competitive App UX Analysis

| Competitor App | Strengths   | Weaknesses   | Opportunities   |
| -------------- | ----------- | ------------ | --------------- |
| [Name]         | [Strengths] | [Weaknesses] | [Opportunities] |

## 12. Success Metrics & KPIs

### 12.1 UX Metrics

- Time to first meaningful action, cart abandonment rate, checkout completion rate

### 12.2 Business Metrics

### 12.3 Technical Metrics

- Crash-free sessions, cold start time, push notification opt-in rate

## 13. Design Agent Collaboration

Document when specialized design assistance (Pencil design tool, Step 3.5) may help, but do not change the main pipeline or skip approval gates.

## 14. Assumptions & Constraints

### Assumptions

- [Assumption 1]

### Constraints

- [Constraint 1 — e.g., App Store/Play Store review guidelines, offline limitations]

## 15. Next Steps

Summarize the research, ask whether the user wants revisions, apply changes if needed, and do not proceed to Step 3.5 (Design) until the user confirms the UX research is acceptable.

```

## Completion Gate

After writing the UX research:

1. Present a concise summary of what was produced.
2. Ask the user whether they want any revisions before proceeding.
3. Apply requested changes and re-save if needed.
4. Do not proceed to Step 3.5 (Design) without user confirmation.
```
