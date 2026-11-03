# Contributing to AI-Powered Fraud Detection System

Thank you for your interest in contributing to the **AI-Powered Fraud Detection System**!

---

## 1. Code of Conduct

Please maintain professional, respectful, and constructive communication in all issues, pull requests, and discussions.

---

## 2. Git Workflow & Branch Strategy

1. **Fork or branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Commit Convention**: We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: A new feature or module
   - `fix(...)`: A bug fix
   - `docs(...)`: Documentation updates
   - `test(...)`: Adding or modifying tests
   - `refactor(...)`: Code refactoring without behavioral change

---

## 3. Development Guidelines

### Backend (Python / FastAPI)
- Adhere to **PEP 8** style guidelines.
- Use explicit type annotations on all function signatures (`pydantic` schemas / Python `typing`).
- Ensure all business logic remains inside `app/services/` rather than in route handlers.
- Run automated tests before committing:
  ```bash
  cd backend
  python -m pytest tests/test_api.py -v
  ```

### Frontend (React / Tailwind CSS)
- Maintain dark institutional fintech aesthetic (`#090D14` app background, `#121B29` cards, `#3B82F6` blue accent).
- Ensure all visual components handle `loading`, `error`, and `empty` states gracefully.
- Run production build check to ensure zero bundling errors:
  ```bash
  cd frontend
  npm run build
  ```

---

## 4. Submitting Pull Requests

1. Ensure all tests pass.
2. Update relevant documentation in `docs/` if modifying features or APIs.
3. Open a Pull Request against `main` with a clear description of changes.

