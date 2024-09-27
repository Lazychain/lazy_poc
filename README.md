# Lazy Chain Proof of Concept

Proof on Concept (Local and Testnet using [kurtosis](https://docs.kurtosis.com/)) [Rollkit](https://rollkit.dev/learn/intro) with [Celestia](https://docs.celestia.org/) as DA and [Artela](https://docs.artela.network/develop) as EVM++.

## Architecture high level

```mermaid
flowchart LR
    subgraph ExecutionEnvironment
        A(EVM)
    end

    subgraph StateValidityMode
        E(Pessimistic)
    end

    subgraph Sequencer
        H(Centralized)
    end

    subgraph Bridging
        K(IBC)
        L(Hyperlane)
    end

    subgraph DALayer
        N(Celestia)
    end

    ExecutionEnvironment --> Rollkit
    StateValidityMode --> Rollkit
    Sequencer --> Rollkit
    Bridging --> Rollkit
    Rollkit --> DALayer
```

## Contents

![toc](./doc/toc.md)
