# Enhanced Interviews Feature

This document outlines a plan to transform the current basic interview logging system into a comprehensive interview platform using Cal.com API for scheduling, video conferencing integration, and structured JTBD (Jobs-to-be-Done) framework implementation.

## Current System

### What We Have Now
- Basic interview logging via `/startups/[id]/interviews/new`
- Simple insight capture with predefined tags (pains, outcomes, features, objections)
- Manual data entry during/after interviews
- No calendar integration or booking system
- No video conferencing integration
- Limited structured workflow guidance

## What We're Building: Complete Interview Lifecycle Management

### Phase 1: Calendar Integration & Booking System

#### Cal.com API Integration
We'll use Cal.com API to handle interview scheduling with these key capabilities:

**Core Features:**
- **Automated booking** with calendar integration
- **Team member assignment** and availability management
- **Video conferencing integration** (Zoom, Google Meet, Teams)
- **Guest invitations** with automated reminders
- **Rescheduling and cancellation** handling

**API Key:** `cal_live_119cbe75592ea3d9d7fbbc5e4ca26f41`

**Key Endpoints:**
- `/bookings` - Create and manage interview bookings
- `/event-types` - Define different interview types and durations
- `/availability` - Check team member availability
- `/webhooks` - Handle booking lifecycle events

#### Interview Creation Workflow

**Simple 6-Step Process:**
1. **Select Startup & Contact** - Choose from existing contacts or add new one
2. **Assign Poblysh Team** - Select interviewer(s) and additional team members
3. **Choose Booking Type** - Select from available Cal.com event types
4. **Add External Guests** - Add via contact selection or email invitation
5. **Customize Details** - Add preparation notes and custom questions
6. **Send Invitation** - Generate booking link and send invitations

**Database Additions:**
```sql
-- Poblysh Team Members
CREATE TABLE poblysh_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    cal_com_user_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interview Assignments
CREATE TABLE interview_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES poblysh_team_members(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- External Guests
CREATE TABLE interview_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    company VARCHAR(255),
    invitation_status VARCHAR(20) DEFAULT 'pending',
    invited_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cal.com Event Types Mapping
CREATE TABLE calcom_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calcom_event_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    length_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    default_for_interviews BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Enhanced Interview Table:**
```sql
ALTER TABLE interviews
ADD COLUMN invitation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN cal_com_booking_id VARCHAR(255),
ADD COLUMN meeting_url VARCHAR(500),
ADD COLUMN meeting_provider VARCHAR(50),
ADD COLUMN preparation_notes TEXT,
ADD COLUMN scheduled_start TIMESTAMP,
ADD COLUMN scheduled_end TIMESTAMP;
```

### Phase 2: Live Interview Interface with Structured Guidance

#### Interview Framework
A structured 5-stage interview process that guides interviewers through customer validation:

**Stage 1: Context & Frame Setting (0-3 minutes)**
- Build rapport and set expectations
- Clarify this is validation, not a sales call
- Understand their role and company context

**Stage 2: Current Workflow Discovery (3-8 minutes)**
- Map their current process and tools
- Identify pain points and frustrations
- Understand success metrics

**Stage 3: Solution Demonstration (8-15 minutes)**
- Show relevant features based on their needs
- Gather initial reactions and feedback
- Address questions and objections

**Stage 4: Jobs-to-be-Done Deep Dive (15-25 minutes)**
- **Functional**: What practical outcomes do they need?
- **Social**: How do they want to be perceived?
- **Emotional**: How do they want to feel?
- Understand decision criteria and stakeholders

**Stage 5: Decision & Next Steps (25-30 minutes)**
- Assess interest level and fit
- Identify decision makers and process
- Define clear next steps and timeline

#### Live Interface Features
- **Video Integration**: Join Zoom/Google Meet/Teams calls directly
- **Stage Navigation**: Clear progress indicators and stage transitions
- **Real-time Notes**: Capture insights as they emerge with timestamps
- **Guided Questions**: Stage-specific question prompts
- **JTBD Capture**: Structured fields for functional/social/emotional jobs
- **Timer**: Keep interviews on track with time guidance

### Phase 3: Video Conferencing Integration

#### Multi-Platform Video Support
Seamless integration with major video conferencing platforms:

**Supported Platforms:**
- **Zoom**: Direct integration via Cal.com
- **Google Meet**: Native calendar integration
- **Microsoft Teams**: Enterprise support
- **Cal.com Video**: Built-in video option

**Key Features:**
- Automatic meeting creation when interviews are scheduled
- One-click join from interview interface
- Meeting links automatically sent to all participants
- Support for meeting recordings (when available)
- Fallback to manual URL entry for other platforms

### Phase 4: Post-Interview Evaluation & Insights

#### Structured Evaluation Framework
Automated analysis of interview data to generate actionable insights:

**JTBD Framework Analysis:**
- **Functional Jobs**: Practical outcomes they need to achieve
- **Social Jobs**: How they want to be perceived by others
- **Emotional Jobs**: How they want to feel during the process
- Importance scoring and pain point identification

**Solution Fit Assessment:**
- **Problem Fit**: How well we address their core challenges
- **Solution Fit**: Feature alignment with their needs
- **Price Fit**: Budget alignment and willingness to pay
- **Timing Fit**: Urgency and implementation timeline

**Commercial Viability:**
- Decision process understanding
- Budget and timeline assessment
- Competitive landscape awareness
- Stakeholder identification

**Recommendation Engine:**
- **Activation Candidate**: High fit + decision maker + budget
- **Follow-up Needed**: Interested but needs more info/approval
- **Not a Fit**: Low interest + poor JTBD fit + no clear need

### Phase 5: Automation & Workflow Integration

#### Webhook Integration System
Real-time synchronization with Cal.com booking lifecycle:

**Webhook Events:**
- **BOOKING_CREATED**: Update interview status when scheduled
- **BOOKING_CANCELLED**: Handle cancellations and rescheduling
- **BOOKING_RESCHEDULED**: Update meeting times
- **MEETING_STARTED**: Trigger interview interface
- **MEETING_ENDED**: Initiate post-interview follow-up

**Automated Notifications:**
- Team notifications for booking confirmations
- Calendar invitations for all participants
- Reminder emails before meetings
- Rescheduling notifications

#### Automated Follow-up System
Smart follow-up sequences based on interview evaluation:

**Activation Candidate Sequence:**
- 1 hour: Setup and onboarding invitation
- 24 hours: Check-in and support offer
- 7 days: Success story request

**Follow-up Needed Sequence:**
- 2 hours: Additional information provided
- 3 days: Decision process check-in
- 7 days: Final follow-up

**Not a Fit Sequence:**
- 1 hour: Thank you and feedback request

#### Pipeline Integration
- Automatic startup status updates based on interview outcomes
- Task creation for follow-up activities
- Dashboard alerts for activation candidates
- Integration with existing pipeline workflow

## Implementation Timeline

### Week 1-2: Cal.com Integration
- Set up Cal.com API client and authentication
- Implement team assignment and guest invitation system
- Create interview booking workflow
- Add database schema updates
- Build basic scheduling interface

### Week 3-4: Live Interview Interface
- Create structured interview guidance system
- Implement stage-based interview workflow
- Add real-time note capture with timestamps
- Integrate video conferencing join buttons
- Build timer and progress tracking

### Week 5-6: Evaluation & Insights
- Build post-interview evaluation interface
- Implement JTBD framework analysis
- Create recommendation engine for candidate qualification
- Add automated follow-up sequences
- Integrate with existing pipeline status updates

### Week 7-8: Polish & Launch
- Optimize user experience and interface
- Add mobile responsiveness
- Implement analytics and reporting
- Team training and documentation
- Gradual rollout to all users

## Success Metrics

### Process Metrics
- **Booking Conversion Rate**: % of invited prospects who schedule interviews
- **Show Rate**: % of scheduled interviews that actually happen
- **Stage Completion Rate**: % of interviews completing all 5 stages

### Business Impact
- **Activation Candidate Rate**: % of interviews resulting in activation candidates
- **Data Quality**: Average JTBD insights captured per interview
- **Time to Decision**: Average time from interview to decision

### User Experience
- **Interface Usability**: User satisfaction scores
- **Feature Adoption**: Usage rates for new interview features
- **Team Efficiency**: Time saved through automation

## Technology Requirements

### External Services
- **Cal.com API**: Scheduling and booking infrastructure ($15/user/month)
- **Video Providers**: Zoom, Google Meet, Teams integrations
- **Email Service**: For follow-up sequences and notifications (~$10/month)

### Development Resources
- **Backend Developer**: 2 weeks for API integration and database changes
- **Frontend Developer**: 3 weeks for interview interface and components
- **UX Designer**: 1 week for interview workflow design

### Key Features
- Automated interview scheduling with calendar integration
- Team assignment and guest invitation management
- Structured interview guidance with JTBD framework
- Video conferencing integration across multiple platforms
- Real-time note capture with timestamps
- Post-interview evaluation and recommendation engine
- Automated follow-up sequences
- Pipeline integration with status updates

## Budget Considerations

### Monthly Recurring Costs
- Cal.com Pro: $15/user/month for team features
- Email Service: ~$10/month for notifications and follow-ups
- Optional recording service: $50-100/month if needed

### Development Investment
- 4-6 weeks of development effort across backend and frontend
- Design and user experience work
- Integration and testing

## Key Benefits

1. **Professional Experience**: Automated booking presents polished image to customers
2. **Team Efficiency**: Scheduling automation saves significant admin time
3. **Data Quality**: Structured guidance ensures comprehensive JTBD data capture
4. **Better Insights**: Rich interview data enables better product decisions
5. **Collaboration**: Team assignment enables coordinated customer interviews
6. **Follow-up Automation**: Systematic follow-up improves conversion rates

This enhanced interview system will transform Poblysh from simple logging into a comprehensive customer validation platform that drives better product decisions and faster customer acquisition.

## Conclusion

This enhanced interviews feature will transform Poblysh from a simple logging system into a comprehensive customer validation platform. By integrating Cal.com for scheduling, supporting multiple video conferencing platforms, and implementing structured JTBD framework guidance, we'll significantly improve:

1. **Interview Quality**: Structured guidance ensures comprehensive data collection
2. **Team Efficiency**: Automated scheduling and follow-up saves time
3. **Data Insights**: Rich JTBD framework capture enables better product decisions
4. **Collaboration**: Team assignment and external guest management enables coordinated interviews
5. **Professional Experience**: Automated booking system presents a polished, professional image to customers

The comprehensive testing strategy, careful deployment planning, and robust monitoring ensure this feature can be rolled out safely with minimal risk while delivering significant value to both the Poblysh team and their customers.

### Success Metrics

Key performance indicators to measure the success of the enhanced interviews feature:

#### Operational Metrics
- **Booking Efficiency**: Average time to schedule interviews (target: <5 minutes)
- **Attendance Rate**: Interview show-up rate (target: >85%)
- **Team Utilization**: Percentage of team members actively participating in interviews
- **Process Compliance**: Percentage of interviews following complete JTBD framework

#### Business Impact
- **Interview Volume**: Number of interviews completed per week (target: 2x increase)
- **Data Quality**: Percentage of interviews with complete insight capture (target: >90%)
- **Activation Rate**: Percentage of interviews leading to activation candidates
- **Customer Satisfaction**: Feedback scores from interview participants

The phased implementation approach allows us to deliver value incrementally while managing development complexity and risk. Starting with Cal.com integration provides immediate value, while the structured interview framework and evaluation systems drive long-term competitive advantage.