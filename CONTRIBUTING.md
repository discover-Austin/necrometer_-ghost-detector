# Contributing to Necrometer

Thank you for your interest in contributing to Necrometer! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use Angular style guide conventions
- Maintain consistent indentation (2 spaces)
- Add JSDoc comments for public methods
- Keep functions small and focused

### Component Structure

```typescript
// 1. Imports
import { Component } from '@angular/core';

// 2. Component decorator
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

// 3. Component class
export class ExampleComponent {
  // Public properties
  // Private properties
  // Constructor
  // Lifecycle hooks
  // Public methods
  // Private methods
}
```

### Commit Messages

Follow the Conventional Commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add spectral frequency analyzer

- Implement real-time frequency analysis
- Add visualization component
- Integrate with sensor service
```

### Testing

- Test on both web and mobile platforms
- Verify camera permissions work correctly
- Test with and without API key configured
- Check all navigation flows
- Verify data persistence

### Pull Request Process

1. Update README.md if needed
2. Ensure all tests pass
3. Update documentation for new features
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Feature Requests

- Open an issue with the `enhancement` label
- Describe the feature clearly
- Explain the use case
- Provide mockups if applicable

## Bug Reports

- Open an issue with the `bug` label
- Include steps to reproduce
- Provide error messages/logs
- Specify device/browser version
- Include screenshots if relevant

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Keep discussions professional

## Questions?

Feel free to open an issue for clarification on any contribution guidelines.

Thank you for contributing! 👻
