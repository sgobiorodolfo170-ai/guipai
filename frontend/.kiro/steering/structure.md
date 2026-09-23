请你使用中文和我对话

# Vue.js Project Structure & Conventions

## Architecture
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development and optimized builds
- **Module System**: ES6 imports with `@/` alias for `src/` directory

## File Organization

### Component Structure
- Use Single File Components (SFC) with `<script setup>`, `<template>`, and `<style scoped>`
- Place reusable components in `src/components/`
- Group related components in subdirectories (e.g., `src/components/icons/`)

### Naming Conventions
- **Vue Components**: PascalCase (e.g., `HelloWorld.vue`, `TheWelcome.vue`)
- **JavaScript Files**: camelCase (e.g., `main.js`)
- **CSS Files**: kebab-case (e.g., `main.css`, `base.css`)

## Code Style Guidelines

### Vue Components
- Use `<script setup>` syntax for Composition API
- Apply `scoped` attribute to `<style>` blocks to prevent CSS leakage
- Import dependencies at the top of script sections
- Use reactive refs and computed properties appropriately

### CSS Organization
- Base styles in `src/assets/base.css`
- Component-specific styles should be scoped
- Use CSS custom properties for consistent theming
- Implement responsive design with mobile-first approach

### Import Patterns
```javascript
// Use @ alias for src imports
import Component from '@/components/Component.vue'
import { ref, computed } from 'vue'
```

## Development Practices
- Keep components focused and single-purpose
- Use props for parent-child communication
- Emit events for child-parent communication
- Leverage Vue's reactivity system effectively
- Write semantic HTML with proper accessibility attributes

## Asset Management
- Static assets go in `public/` directory
- Processed assets (images, fonts) go in `src/assets/`
- Import assets in components when they need processing





# Kiro Steering Configuration for Stock Review & Analysis Platform
project:
  name: TradeInsight
  type: web-application
  domain: financial-analysis

## Technical Architecture
architecture:
  frontend:
    framework: vue@3
    ui-library: element-plus
    charting: echarts@5
    state-management: pinia
    build-tool: vite
  backend:
    framework: spring-boot@3
    database: MYSQL
    cache: redis@7
    auth: sa-token

## Core Modules
modules:
  - name: authentication
    description: Secure user authentication and authorization
    components:
      - user-management
      - role-based-access
      - session-management
    dependencies:
      - sa-token
      - spring-security
      

## Development Workflows
workflows:
  local-development:
    description: Setup local development environment
    steps:
      - frontend: npm install && npm run dev
    ports:
      - frontend: 5173
      - backend: 8080
      - redis: 6379


## Documentation Standards
documentation:
  api-spec: openapi@3.0
  component-docs: vue-styleguidist
  financial-glossary: 
    terms:
      - OHLC: Open, High, Low, Close prices
      - RSI: Relative Strength Index
      - MACD: Moving Average Convergence Divergence
      - EMA: Exponential Moving Average
  diagram-types:
    - sequence-diagrams: trading workflows
    - architecture-diagrams: system overview
    - data-flow: market data processing
