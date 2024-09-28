# 2. User NFT Transfer from Other blockchain Flow

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
