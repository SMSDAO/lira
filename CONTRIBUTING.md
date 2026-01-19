# Contributing to Lira Protocol

Thank you for your interest in contributing to Lira Protocol! This document provides guidelines and instructions for contributing.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Pull Request Process](#pull-request-process)
7. [Security](#security)

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Basic knowledge of React, TypeScript, and Solidity
- Familiarity with Git

### Setup Development Environment

1. **Fork the repository**
```bash
# Click "Fork" on GitHub
```

2. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/lira.git
cd lira
```

3. **Add upstream remote**
```bash
git remote add upstream https://github.com/SMSDAO/lira.git
```

4. **Install dependencies**
```bash
npm install
cd backend/php && composer install
cd ../go && go mod download
```

5. **Set up environment**
```bash
cp .env.example .env
# Configure your .env file
```

6. **Run the development server**
```bash
npm run dev
```

## Development Workflow

### Branch Naming
- Feature: `feature/description-of-feature`
- Bug fix: `fix/description-of-fix`
- Documentation: `docs/description`
- Performance: `perf/description`

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(contracts): add quantum oracle integration

- Implement Q# quantum predictor
- Add parallel agent execution
- Update AgentExecutor contract

Closes #123
```

### Development Process

1. **Create a branch**
```bash
git checkout -b feature/my-feature
```

2. **Make your changes**
```bash
# Write code
# Add tests
# Update documentation
```

3. **Run tests**
```bash
npm run test
npx hardhat test
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add new feature"
```

5. **Keep your fork updated**
```bash
git fetch upstream
git rebase upstream/main
```

6. **Push to your fork**
```bash
git push origin feature/my-feature
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Prefer const over let
- Use meaningful variable names

```typescript
// Good
const userTokenBalance = await getUserBalance(address);

// Avoid
const x = await getBalance(addr);
```

### Solidity

- Use Solidity 0.8.20
- Follow OpenZeppelin patterns
- Document with NatSpec
- Include require statements with clear error messages

```solidity
/// @notice Creates a new agent with model configuration
/// @param name Agent name
/// @param modelType Type of AI model
/// @return agentId The ID of created agent
function createAgent(
    string memory name,
    string memory modelType
) external returns (uint256 agentId) {
    require(bytes(name).length > 0, "Name required");
    // Implementation
}
```

### Go

- Follow Go conventions
- Use gofmt
- Write idiomatic Go
- Handle errors explicitly

```go
// Good
if err != nil {
    return fmt.Errorf("failed to create agent: %w", err)
}

// Avoid
if err != nil {
    panic(err)
}
```

### PHP

- Follow PSR-12 coding standards
- Use namespaces
- Type hint parameters and return types
- Document with PHPDoc

```php
/**
 * Get all tokens
 * 
 * @return array<Token>
 */
public function getAllTokens(): array {
    // Implementation
}
```

## Testing

### Smart Contracts

```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/Lira.test.js

# Check coverage
npx hardhat coverage
```

All new contracts must have:
- Unit tests (>90% coverage)
- Integration tests
- Gas usage tests

### Frontend

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

All new components should have:
- Component tests
- Integration tests
- Accessibility tests

### Backend

```bash
# PHP tests
cd backend/php && composer test

# Go tests
cd backend/go && go test ./...
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Title
Follow conventional commits format:
```
feat(contracts): add quantum oracle integration
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Follows code style

## Screenshots (if applicable)
Add screenshots here
```

### Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer approval required
3. Address all review comments
4. Squash commits if requested
5. Maintainer will merge

## Areas for Contribution

### High Priority
- Smart contract optimizations
- Frontend UI/UX improvements
- Documentation improvements
- Test coverage increase
- Security enhancements

### Good First Issues
Look for issues labeled:
- `good first issue`
- `help wanted`
- `documentation`

### Feature Requests
- Open an issue first to discuss
- Wait for maintainer feedback
- Then implement if approved

## Security

### Reporting Vulnerabilities
**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email: security@lira.ai
2. Provide detailed description
3. Include steps to reproduce
4. Wait for response before disclosure

### Security Considerations
- Never commit private keys
- Use environment variables
- Validate all inputs
- Follow security best practices
- Run security audits on contracts

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## Questions?

- GitHub Discussions: https://github.com/SMSDAO/lira/discussions
- Discord: [Coming soon]
- Email: dev@lira.ai

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to Lira Protocol! 🚀
