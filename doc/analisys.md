# Analysis

## Context

### Explore the problem

Consider an NFT collection that belongs to different L1 blockchains. Adding more functionality implies to develop these functionalities for every blockchain. Having a unique blockchain speed development new features that would be impossible to do on different blockchains.

### Scenarios and User Stories documentation

In this point we **express the needs that the user have in a form of user stories. It specifies the outcome that the user need**

#### 1. User Login

```mermaid
---
title: User Login Flow
---
flowchart LR
    A(Login) --> B{Valid Wallet?}
    B --> |No| A
    B --> |Yes| C(User Menu)
```

```gherkin
Feature: User Login
  As a user
  I want to be able to log in with valid credentials
  So that I can access the system

Scenario: Valid login
  Given I have provided valid username and password
  When I submit the login form
  Then I should see the Books Selection Flow page

Scenario: Invalid login
  Given I have provided invalid username or password
  When I submit the login form
  Then I should be prompted to re-enter my credentials
  And I will not see the Books Selection Flow page
```

- [Acceptance Criteria](ac/0001-user-login.md)

#### 2. User NFT Transfer from Other blockchain Flow

```mermaid
---
title: User NFT Transfer from Other blockchain Flow
---
flowchart LR
    A(User Logged) --> B{NFT on List?}
    B --> |Yes| X(Exit flow)
    B --> |No| C(Select Blockchain)
    C --> D(Select NFT to Transfer)
    D --> E{Confirm?}
    E --> |No| C
    E --> |Yes| Y(Transfer, Pay Gas Fee)
    Y --> X
```

> [!NOTE]  
> Should we consider from lazy chain to send back to origin blockchains?
> [!IMPORTANT]
> Add gherkin scenarios

#### 3. User NFT Staking Flow

```mermaid
---
title: User NFT Staking Flow
---
flowchart LR
    A(User Logged) --> B{NFT on List?}
    B --> |Yes| C(Select Staking Period)
    C --> D(Execute and Pay Fees)
    D --> B    
    B --> |No| X(Exit flow)
```

> [!IMPORTANT]
> Add gherkin scenarios

#### 4. User NFT Unstaking Flow

```mermaid
---
title: User NFT unstaking Flow
---
flowchart LR
    A(User Logged) --> B{NFT on List?}
    B --> |No| X(Exit flow)
    B --> |Yes| C(Select Unstaking option)
    C --> D{Can Unstake?}
    D --> |Yes| E(Execute and Pay Fees)
    E --> B
    D --> |No| B    

```

> [!IMPORTANT]
> Add gherkin scenarios
