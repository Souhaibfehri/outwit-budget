# Foxy AI Coach Setup Instructions

## Environment Variables Required

Add these variables to your `.env.local` file:

```bash
# OpenAI Configuration for Foxy AI Coach
OPENAI_API_KEY=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
OPENAI_ASSISTANT_ID=asst_DBm1JPJIgHg9dodpB7zv6fxH

# Feature flags
NEXT_PUBLIC_FOXY_ENABLED=true
NEXT_PUBLIC_FOXY_DEBUG=false
```

## OpenAI Assistant Configuration

The assistant is already configured with:
- **Assistant ID**: `asst_DBm1JPJIgHg9dodpB7zv6fxH`
- **Beta Header**: `OpenAI-Beta: assistants=v2`

## Foxy AI Identity

Foxy is configured with the following personality and guidelines:
- Friendly and intelligent AI personal finance guide
- Empathetic, non-judgmental companion
- Educational focus (no direct financial advice)
- Action-oriented with practical recommendations
- Storytelling approach with analogies
- Privacy-respectful with user consent

## Database Migration

Run the following command to apply the new Foxy coach models:

```bash
npx prisma generate
```

Note: The schema has been updated with UserCoachState, TutorialStep, Badge, and CoachMessage models.

## Features Included

1. **Tutorial Mode**: 9-step guided tour
2. **Coach Mode**: AI-powered insights and suggestions  
3. **Badge System**: 12 gamification badges
4. **Event Tracking**: User action analytics
5. **Jargon Tooltips**: Educational explanations
6. **Progress Tracking**: Tutorial completion and streaks
7. **Celebrations**: Badge unlocks with confetti
8. **Tool Integration**: AI can trigger app actions

## Testing

Once environment variables are added, Foxy will:
1. Appear as a floating button on all app pages
2. Start in Tutorial Mode for new users
3. Guide users through the 9-step tutorial
4. Switch to Coach Mode after completion
5. Provide AI-powered insights based on user data
