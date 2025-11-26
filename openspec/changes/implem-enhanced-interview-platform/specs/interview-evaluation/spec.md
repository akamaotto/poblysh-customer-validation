# interview-evaluation Specification

## Purpose
Provide automated interview evaluation with JTBD framework analysis, solution fit assessment, and recommendation engine for systematic candidate qualification and decision support.

## ADDED Requirements

### Requirement: JTBD Framework Analysis
The system SHALL analyze interview insights using Jobs-to-be-Done framework to extract functional, social, and emotional jobs with importance scoring.

#### Scenario: Functional Jobs Analysis
- **WHEN** interview insights contain functional pain points or needs
- **THEN** extract practical outcomes the customer needs to achieve
- **AND** categorize functional jobs by frequency and importance
- **AND** score functional jobs on importance scale (1-5)
- **AND** identify functional job conflicts or priorities

#### Scenario: Social Jobs Analysis
- **WHEN** interview reveals social or status-related concerns
- **THEN** extract how the customer wants to be perceived by others
- **AND** identify social status implications of current solution
- **AND** capture desired social outcomes and recognition
- **AND** score social jobs based on expressed importance

#### Scenario: Emotional Jobs Analysis
- **WHEN** emotional responses or feelings are expressed
- **THEN** extract how the customer wants to feel during the process
- **AND** identify emotional pain points in current workflow
- **AND** capture desired emotional states and experiences
- **AND** score emotional jobs based on intensity and frequency

#### Scenario: JTBD Insight Synthesis
- **WHEN** interview is completed with captured insights
- **THEN** synthesize JTBD jobs into ranked priority list
- **AND** identify job conflicts and trade-offs
- **AND** highlight jobs that align with solution capabilities
- **AND** generate JTBD summary with key findings

### Requirement: Solution Fit Assessment
The system SHALL evaluate how well the solution addresses customer needs across problem fit, solution fit, price fit, and timing fit dimensions.

#### Scenario: Problem Fit Evaluation
- **WHEN** customer problems and pain points are identified
- **THEN** map problems to solution capability coverage
- **AND** score problem fit based on problem-solution alignment (1-5)
- **AND** identify uncovered problems and gaps
- **AND** assess problem urgency and impact on customer

#### Scenario: Solution Fit Evaluation
- **WHEN** customer requirements and feature needs are expressed
- **THEN** match requirements against available solution features
- **AND** score solution fit based on feature alignment (1-5)
- **AND** identify missing features and customization needs
- **AND** assess solution complexity and implementation requirements

#### Scenario: Price Fit Evaluation
- **WHEN** budget and pricing discussions occur
- **THEN** capture budget constraints and willingness to pay indicators
- **AND** assess pricing alignment with customer value perception
- **AND** score price fit based on budget alignment (1-5)
- **AND** identify pricing objections or concerns

#### Scenario: Timing Fit Evaluation
- **WHEN** implementation timeline and urgency are discussed
- **THEN** capture customer timeline constraints and priorities
- **AND** assess timeline alignment with solution deployment requirements
- **AND** score timing fit based on schedule compatibility (1-5)
- **AND** identify timing barriers or accelerators

### Requirement: Commercial Viability Assessment
The system SHALL evaluate commercial potential through decision process understanding, budget assessment, competitive awareness, and stakeholder identification.

#### Scenario: Decision Process Mapping
- **WHEN** decision-making procedures are discussed
- **THEN** capture decision criteria and evaluation process
- **AND** identify decision makers and influencers
- **AND** map decision timeline and approval requirements
- **AND** assess decision complexity and potential barriers

#### Scenario: Budget and Timeline Assessment
- **WHEN** financial and timing constraints are revealed
- **THEN** capture available budget and approval requirements
- **AND** identify procurement processes and financial stakeholders
- **AND** assess implementation timeline and resource availability
- **AND** evaluate budget-timeline alignment and risks

#### Scenario: Competitive Landscape Analysis
- **WHEN** competitive solutions or alternatives are mentioned
- **THEN** identify competing solutions and customer perceptions
- **AND** assess switching costs and barriers to change
- **AND** capture competitive advantages and disadvantages
- **AND** evaluate differentiation opportunities

#### Scenario: Stakeholder Identification
- **WHEN** various team members and departments are involved
- **THEN** identify key stakeholders and their roles
- **AND** map stakeholder influence and decision power
- **AND** capture stakeholder-specific needs and concerns
- **AND** assess stakeholder alignment and potential objections

### Requirement: Recommendation Engine
The system SHALL generate automated recommendations for candidate qualification based on comprehensive interview evaluation and predefined business rules.

#### Scenario: Activation Candidate Identification
- **WHEN** interview evaluation shows high fit and decision authority
- **THEN** recommend "Activation Candidate" status
- **AND** provide reasoning: high problem/solution fit + decision maker + available budget + clear timeline
- **AND** suggest immediate next steps: setup invitation, success story request, priority onboarding
- **AND** calculate activation confidence score (80-100%)

#### Scenario: Follow-up Needed Identification
- **WHEN** interview shows interest but requires additional information
- **THEN** recommend "Follow-up Needed" status
- **AND** provide reasoning: good fit but needs more info/approval/demo/customization
- **AND** suggest specific follow-up actions: additional information, stakeholder meeting, custom proposal
- **AND** set follow-up timeline based on urgency (2-14 days)

#### Scenario: Not a Fit Identification
- **WHEN** interview shows poor alignment or no clear need
- **THEN** recommend "Not a Fit" status
- **AND** provide reasoning: low interest + poor JTBD fit + no clear need + budget/timeline mismatch
- **AND** suggest appropriate closing actions: thank you note, future possibility, referral request
- **AND** archive interview with relevant insights for future reference

#### Scenario: Recommendation Customization
- **WHEN** business rules or evaluation criteria change
- **THEN** allow customization of recommendation thresholds
- **AND** enable custom recommendation categories and logic
- **AND** provide recommendation weight adjustments
- **AND** track recommendation accuracy and feedback

### Requirement: Post-Interview Evaluation Interface
The system SHALL provide comprehensive evaluation interface with automated insights, manual override capabilities, and detailed scoring breakdowns.

#### Scenario: Automated Evaluation Display
- **WHEN** interview is completed and evaluation is generated
- **THEN** display overall recommendation with confidence score
- **AND** show detailed scoring breakdown: JTBD analysis, fit assessment, commercial viability
- **AND** present key insights and supporting evidence
- **AND** provide recommended next actions with timeline

#### Scenario: Manual Evaluation Override
- **WHEN** interviewer disagrees with automated recommendation
- **THEN** allow manual status override with justification
- **AND** capture reasoning for override decision
- **AND** update evaluation scores based on human judgment
- **AND** log override for model improvement and audit purposes

#### Scenario: Evaluation Review and Approval
- **WHEN** evaluations require team review
- **THEN** enable evaluation assignment for team review
- **AND** provide collaborative commenting and discussion
- **AND** support evaluation approval workflow
- **AND** track evaluation status and reviewer feedback

#### Scenario: Evaluation Summary Export
- **WHEN** evaluation reports need to be shared
- **THEN** generate PDF evaluation summary with key findings
- **AND** export evaluation data for CRM integration
- **AND** create executive summary with recommendation highlights
- **AND** provide raw data export for analysis purposes

### Requirement: Evaluation Analytics and Reporting
The system SHALL provide analytics on evaluation patterns, recommendation accuracy, and interview quality trends.

#### Scenario: Recommendation Accuracy Tracking
- **WHEN** recommendations are compared with actual outcomes
- **THEN** track recommendation accuracy by category and interviewer
- **AND** measure prediction confidence vs. actual conversion rates
- **AND** identify patterns in successful vs. unsuccessful evaluations
- **AND** generate accuracy reports for model improvement

#### Scenario: Interview Quality Metrics
- **WHEN** evaluation quality needs to be assessed
- **THEN** track JTBD insight capture completeness
- **AND** measure interview stage completion rates
- **AND** analyze evaluation score distributions
- **AND** identify high-performing interview patterns

#### Scenario: Business Impact Analysis
- **WHEN** evaluation effectiveness needs to be measured
- **THEN** correlate evaluation recommendations with pipeline progression
- **AND** measure activation candidate conversion rates
- **AND** analyze time-to-decision improvements
- **AND** calculate ROI from evaluation-driven efficiencies