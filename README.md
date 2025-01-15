# E2E Testing Repository with Playwright

## Overview

This repository is dedicated to End-to-End (E2E) testing, utilizing the powerful Playwright framework. E2E testing is a technique used to test whether the flow of an application is functioning as expected from start to finish. It aims to replicate real user scenarios, ensuring that the system integrates and works flawlessly in a real-world environment. In this repository, we leverage Playwright, an open-source framework that allows for reliable E2E testing across modern web apps. Playwright supports multiple browsers and provides a rich set of tools for running and verifying tests. Additionally, Docker-Compose is used to streamline the setup and maintenance of the testing environment, providing a consistent platform for running these tests.

## Getting Started

To get started with this repository, clone it to your local machine and set up the required environment.

### Prerequisites

Before setting up the project, ensure that you have the following installed:

- Docker and Docker-Compose: [Docker](https://docs.docker.com/get-docker/)
- Node.js: [Node.js](https://nodejs.org/en/download/)

### Installation

Follow these steps to set up the project locally:

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   ```
2. **Navigate to the Repository Folder**:
   ```bash
   cd e2e-tests
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Build API-ENGINE docker image**
   - In [rainbow-api-engine](https://gitlab.com/aarav-unmanned/rainbow-api-engine) repository build it's docker image and tag it
   ```bash
      docker build . -t api-engine-test
   ```
5. **Build UI docker image**
   - In [rainbow-ui](https://gitlab.com/aarav-unmanned/rainbow-ui) repository build it's docker image and tag it and
   Copy .env.e2e to env.e2e.local in rainbow ui and do the following:
	- change VITE_BACKEND_URL value to http://localhost:81
	- build the rainbow ui image again after this

   ```bash
      docker build . -t ui-test --build-arg app_env=e2e
   ```
6. **Export environment variables**

   - Export UI_IMAGE and API_ENGINE_IMAGE environment variables in shell in which you are going to run the next command

   ```bash
   export UI_IMAGE=ui-test
   export API_ENGINE_IMAGE=api-engine-test
   ```


7. **Set Up the Testing Environment**:

   ```bash
   docker compose up -f docker-compose.sample.yml
   ```

### Running Tests

To run the E2E tests, run the following command:

```bash
npx playwright test --ui
```

This command executes the Playwright tests with a user interface, providing a more interactive testing experience.

### Writing Tests

When writing new E2E tests, consider the following guidelines:

1. Test Structure: Organize your tests logically, reflecting the user flow of your application.
2. Naming Conventions: Use clear and descriptive names for your test files and test cases.
3. Data Fixtures: Manage test data effectively, ensuring it represents realistic scenarios without affecting real data.
4. Test Isolation: Each test should be independent to avoid side effects between tests.

Feel free to explore the test examples included in this repository for a better understanding of how to structure and write effective E2E tests.
