# Enhanced Interview Platform - Design Document

## Architecture Overview

This enhancement transforms the current basic interview logging system into a comprehensive interview platform spanning multiple integrated systems. The design balances immediate value delivery with long-term extensibility.

## System Architecture

### Core Components

#### 1. Cal.com Integration Layer
**Purpose**: External scheduling and booking infrastructure
**Approach**: API client pattern with webhook handling
**Rationale**: Leverages proven scheduling solution rather than building custom calendar management

#### 2. Interview Management Engine
**Purpose**: Core interview lifecycle and assignment logic
**Approach**: Extended interview entity with assignment and guest management
**Rationale**: Builds on existing interview data model while adding team collaboration

#### 3. Structured Interview Framework
**Purpose**: Guided interview workflow with JTBD framework
**Approach**: Stage-based interview interface with real-time capture
**Rationale**: Standardizes interview quality while maintaining flexibility

#### 4. Video Conferencing Integration
**Purpose**: Multi-platform video meeting support
**Approach**: Meeting URL management with one-click join
**Rationale**: Supports user preferences without deep platform integration

#### 5. Evaluation & Insights Engine
**Purpose**: Automated analysis and recommendation system
**Approach**: Rule-based evaluation with configurable criteria
**Rationale**: Provides immediate value while allowing future ML enhancement

## Data Model Design

### Entity Relationships
```
Startup (existing)
├── Interview (enhanced)
│   ├── InterviewAssignment (new)
│   ├── InterviewGuest (new)
│   └── InterviewInsight (existing, enhanced)
├── Contact (existing)
└── PoblyshTeamMember (new)
```

### Key Design Decisions

#### 1. Separate Team Member Management
**Decision**: Dedicated `poblysh_team_members` table rather than extending user system
**Rationale**: Allows external team members and flexible role assignment
**Trade-off**: Additional complexity vs. user system integration

#### 2. Cal.com Event Type Mapping
**Decision**: Store Cal.com event type references rather than full definitions
**Rationale**: Reduces synchronization complexity and leverages Cal.com as source of truth
**Trade-off**: Dependency on external service availability

#### 3. JTBD Framework Integration
**Decision**: Enhance existing `interview_insights` table with JTBD fields
**Rationale**: Preserves existing data while adding structured capture
**Trade-off**: Table complexity vs. separate JTBD system

#### 4. Interview Status Management
**Decision**: Add booking lifecycle states to interview entity
**Rationale**: Single source of truth for interview status across scheduling and evaluation
**Trade-off**: Interview table complexity vs. separate status tracking

## Integration Patterns

### Cal.com Integration
**Pattern**: API client with webhook callbacks
**Flow**:
1. Frontend creates booking via Cal.com API
2. Webhook updates interview status in our system
3. Synchronization handles changes and cancellations

**Benefits**:
- Real-time booking availability
- Automatic calendar integration
- Reduced server load

**Risks**:
- External service dependency
- Webhook reliability
- Rate limiting considerations

### Video Conferencing Integration
**Pattern**: URL management with platform detection
**Flow**:
1. Extract meeting URLs from Cal.com booking data
2. Detect platform (Zoom, Meet, Teams)
3. Provide platform-specific join buttons

**Benefits**:
- Platform agnostic
- Minimal integration complexity
- User choice preservation

**Risks**:
- Limited meeting control
- URL format changes
- Platform limitations

### Follow-up Automation
**Pattern**: Rule-based sequence engine
**Flow**:
1. Interview evaluation triggers qualification rules
2. Rules select appropriate follow-up sequence
3. Email sequences execute based on evaluation timing

**Benefits**:
- Configurable business logic
- Immediate implementation
- Easy modification

**Risks**:
- Rule complexity management
- Email deliverability
- Sequence relevance

## Technology Choices

### Backend
- **Rust/Axum**: Consistent with existing stack
- **SeaORM**: Leverages existing database patterns
- **reqwest**: HTTP client for Cal.com API

### Frontend
- **Next.js/TypeScript**: Consistent with existing stack
- **React Query**: Cache management for booking states
- **Cal.com SDK**: Direct integration where available

### External Services
- **Cal.com Pro**: Scheduling infrastructure ($15/user/month)
- **Resend**: Email delivery for follow-up sequences
- **Existing email service**: Notifications and alerts

## Security Considerations

### API Key Management
- Secure storage of Cal.com API key
- Environment-based configuration
- Access logging and monitoring

### Data Privacy
- Guest contact information protection
- Meeting recording consent management
- JTBD insight access controls

### Webhook Security
- Request signature verification
- IP whitelisting where supported
- Idempotency handling

## Performance Considerations

### Cal.com API Rate Limits
- Implement request queuing
- Cache availability data
- Batch operations where possible

### Real-time Features
- WebSocket consideration for live interview updates
- Optimistic updates for booking actions
- Conflict resolution for simultaneous edits

### Database Performance
- Indexing on new foreign key relationships
- Query optimization for interview listings
- Archive strategy for historical data

## Scalability Design

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- External service offloading

### Data Growth
- Interview recording storage strategy
- Insight data compression
- Archive and cleanup processes

## Monitoring & Observability

### Key Metrics
- Booking success rates
- Interview completion rates
- Webhook processing times
- Follow-up sequence effectiveness

### Alerting
- Cal.com API failures
- Webhook processing errors
- Email delivery issues
- Database performance degradation

## Deployment Strategy

### Phased Rollout
1. **Phase 1**: Cal.com integration and team assignment
2. **Phase 2**: Structured interview interface
3. **Phase 3**: Video integration and evaluation
4. **Phase 4**: Automation workflows

### Feature Flags
- Cal.com integration toggle
- Structured interview guidance
- Automated follow-up sequences
- Evaluation engine

### Rollback Planning
- Database migration reversibility
- Feature flag disablement
- External service disconnection
- Data backup procedures

## Future Extensibility

### AI Integration Points
- Interview transcript analysis
- JTBD insight extraction
- Recommendation engine enhancement
- Follow-up personalization

### Advanced Scheduling
- Team availability optimization
- Interview type matching
- Automated rescheduling
- Multi-timezone support

### Integration Expansion
- Additional video platforms
- CRM system integration
- Analytics platforms
- Custom workflow engines