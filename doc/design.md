# Design

## Context

Celestine Sloth Society wants to have his own blockchain to evolve his main product NFT collection.
We are going to use a **modular blockchain** using **Sovereign Rollups** using Artela EVM++ as **Execution Layer**, **Rollkit** as **Settlement and consensus** layer (**cometBFT**) and **Celestia** as **Data Availability** layer.

## Main Goal

- Create a **modular blockchain** using **Sovereign Rollups** using Artela EVM++ as **Execution Layer**, **Rollkit** as **Settlement and consensus** layer (**cometBFT**) and **Celestia** as **Data Availability** layer.
- Transfer NFT Collections from other blockchains.
- Allow users to Stake their NFT.

## Sub Goals

- The system should be distributed, secure and scalable.

### Links

- [Forma Bridge](https://www.stride.zone/blog/stride-s-hyperlane-bridge-deployment-is-live-bridge-tia-to-forma)
- [Forma sdk](https://github.com/forma-dev/sdk/tree/main/contracts)
- [Celestia](https://celestia.org/what-is-celestia/)
- [RollKit](https://rollkit.dev/tutorials/artela-evm-plus-plus)
- [Hyperlane](https://docs.hyperlane.xyz/docs/deploy-hyperlane)
- [Artela](https://docs.artela.network/develop)

### UML

#### Gas Bridge (Celestia TIA - Lazy TIA)

```mermaid
flowchart TB
    %% OC origin chain
    subgraph OC["Celestia Chain"]
        OC_NT["Native Token"]
        OC_IBC_LC["IBC Light Client"]
    end

    %% DC Destination chain
    subgraph DC["Lazy Chain"]
        subgraph DC_FE["UI Web Bridge"]
            DC_FE_UI["Celestia TIA <-> Lazy TIA"]
        end
        subgraph DC_SC["Smart Contracts"]
            DC_ERC20["Lazy Native TIA"]
            subgraph DC_HL["Hyperlane"]
                DC_MINT["Collateral - Mint"]
                DC_MAIL["Mail"]
                DC_ISM["ISM"]

                DC_MAIL <--> DC_ISM
                DC_MAIL <--> DC_MINT
            end
        end

    end

    %% IC intermediate chain
    subgraph IC["Stride Chain"]
        IC_ICS20["Voucher TIA"]
        IC_IBC_LC["IBC Light Client"]
        subgraph IC_HL["Hyperlane"]
            IC_LOCK["Voucher TIA Collateral - Lock"]
            IC_MAIL["Mail"]
            IC_GAS["TIA Gas Pay"]

            IC_MAIL <--> IC_GAS
            IC_MAIL <--> IC_LOCK
        end
    end

    subgraph IBC["IBC"]
        IBC_RL["Relayer"]
    end

    subgraph HL["Hyperlane Bridge"]
        HL_RY["Hyperlane Relayer"]
        HL_A["Agent A"]
        HL_B["Agent B"]
    end

    OC_NT -- 1- Lock TIA --> IBC_RL
    IBC_RL -- 2- Mint TIA Voucher --> IC_ICS20
    OC_IBC_LC -- Chains state --> IC_IBC_LC

    IC_ICS20 -- 3- Send --> IC_MAIL
    IC_MAIL -- 4- Dispatch --> HL_A
    HL_A --> HL_RY
    HL_RY --> HL_B
    HL_B -- 5- Handle --> DC_MAIL
    DC_MAIL -- 6- Receive --> DC_ERC20
```

> [!IMPORTANT]
> Add sequence diagram
> **Tasks**

- Lazy TIA **ERC1155** smart contract using Solidity
  - [eip-1155](https://eips.ethereum.org/EIPS/eip-1155)
  - [Forma 1155 and 721](https://github.com/forma-dev/sdk/tree/main/contracts)
  - Receive ok / Refund is handle by Hyperlane bridge?
- Define warp routes for Hyperlane Bridge
  - [deploy-warp-route](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route})
  - [Submit to Registry](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- Create a Bridge UI
  - [deploy-warp-route-UI](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route-UI#fork--customize-the-ui)
  - [Example](https://github.com/forma-dev/hyperlane-bridge-ui)

#### NFT Transfer from StarGaze

```mermaid
flowchart TB
    subgraph SG["StarGaze"]
        subgraph SG_SC["Smart Contracts"]
            SG_CW721["CW-721"]
            subgraph SG_HL["Hyperlane"]
                SG_LOCK["Collateral - Lock"]
                SG_MAIL["Mail"]
                SG_GAS["STAR Gas Pay"]

                SG_MAIL <--> SG_GAS
            end
        end
    end

    subgraph HL_SG["Hyperlane"]
        HL_SG_RY["Hyperlane Relayer"]
        HL_SG_A["Agent A"]
        HL_SG_B["Agent B"]
    end

    subgraph RK["Artela Rollkit"]
         RK_GF["TIA Gas Fee Sequencer"]

        subgraph RK_SC["Smart Contracts"]
            RK_SC_SG_NFT["StarGaze CW721-ERC1155 Adapter"]
            RK_SC_721["ERC1155"]
            subgraph RK_SC_HL_SG["Hyperlane"]
                RK_SC_HL_SG_MINT["Collateral - Mint"]
                RK_SC_HL_SG_MAIL["Mail"]
                RK_SC_HL_SG_ISM["ISM"]

                RK_SC_HL_SG_MAIL <--> RK_SC_HL_SG_ISM
            end
        end
    end

    subgraph Celestia["Celestia Data Availability"]
    end

    SG_CW721 -- Transfer to Artela RK --> SG_LOCK
    SG_LOCK -- Transfer --> SG_MAIL
    SG_MAIL -- Dispatch --> HL_SG_A
    HL_SG_A --> HL_SG_RY
    HL_SG_RY --> HL_SG_B
    HL_SG_B -- Handle --> RK_SC_HL_SG_MAIL
    RK_SC_HL_SG_MAIL --> RK_SC_HL_SG_MINT
    RK_SC_HL_SG_MINT --> RK_SC_SG_NFT
    RK_SC_SG_NFT --> RK_SC_721

    RK_SC_721 --> Celestia

    classDef green fill:#696,stroke:#333;
    classDef purple fill:#969,stroke:#333;
    class RK_GF purple
    class RK_SEQ green
    class RK_SC_721 green
```

> [!IMPORTANT]
> Add sequence diagram
> **Tasks**

- Lazy TIA **ERC1155** smart contract using Solidity
  - [Forma 721](https://github.com/forma-dev/sdk/tree/main/contracts)
  - Receive ok / Refund is handle by Hyperlane bridge?
- Define warp routes for Hyperlane Bridge
  - [deploy-warp-route](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route})
  - [Submit to Registry](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- Create a Bridge UI for NFT
  - [deploy-warp-route-UI](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route-UI#fork--customize-the-ui)
  - [Example](https://github.com/forma-dev/hyperlane-bridge-ui)

#### NFT Transfer from FORMA

```mermaid
flowchart TB
    subgraph FM["Forma"]
        subgraph FM_SC["Smart Contracts"]
            FM_ERC721["ERC1155"]
            subgraph FM_HL["Hyperlane"]
                FM_LOCK["Collateral - Lock"]
                FM_MAIL["Mail"]
                FM_GAS["F-TIA Gas Pay"]

                FM_MAIL <--> FM_GAS
            end
        end
    end

    subgraph HL_FM["Hyperlane"]
        HL_FM_RY["Hyperlane Relayer"]
        HL_FM_A["Agent A"]
        HL_FM_B["Agent B"]
    end

    subgraph RK["Artela Rollkit"]
         RK_GF["TIA Gas Fee Sequencer"]

        subgraph RK_SC["Smart Contracts"]
            RK_SC_FM_NFT["Forma ERC1155-ERC1155 Adapter"]
            RK_SC_721["ERC1155"]
            subgraph RK_SC_HL_FM["Hyperlane"]
                RK_SC_HL_FM_MINT["Collateral - Mint"]
                RK_SC_HL_FM_MAIL["Mail"]
                RK_SC_HL_FM_ISM["ISM"]

                RK_SC_HL_FM_MAIL <--> RK_SC_HL_FM_ISM
            end
        end
    end

    subgraph Celestia["Celestia Data Availability"]
    end

    FM_ERC721 -- Transfer to Artela RK --> FM_LOCK
    FM_LOCK -- Transfer --> FM_MAIL
    FM_MAIL -- Dispatch --> HL_FM_A
    HL_FM_A --> HL_FM_RY
    HL_FM_RY --> HL_FM_B
    HL_FM_B -- Handle --> RK_SC_HL_FM_MAIL
    RK_SC_HL_FM_MAIL --> RK_SC_HL_FM_MINT
    RK_SC_HL_FM_MINT --> RK_SC_FM_NFT
    RK_SC_FM_NFT --> RK_SC_721

    RK_SC_721 --> Celestia

    classDef green fill:#696,stroke:#333;
    classDef purple fill:#969,stroke:#333;
    class RK_GF purple
    class RK_SEQ green
    class RK_SC_721 green
```

> [!IMPORTANT]
> Add sequence diagram
> **Tasks**

- Lazy TIA **ERC1155** smart contract using Solidity
  - [Forma 721](https://github.com/forma-dev/sdk/tree/main/contracts)
  - Receive ok / Refund is handle by Hyperlane bridge?
- Define warp routes for Hyperlane Bridge
  - [deploy-warp-route](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route})
  - [Submit to Registry](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- Create a Bridge UI for NFT
  - [deploy-warp-route-UI](https://docs.hyperlane.xyz/docs/guides/deploy-warp-route-UI#fork--customize-the-ui)
  - [Example](https://github.com/forma-dev/hyperlane-bridge-ui)

#### Data Availability Flow

```mermaid
flowchart TB
    User["User"]

    subgraph Frontend["lazy.fun"]
        subgraph RKC["Rollkit Client"]
            RKC_A["Client"] 
            RKC_B["go-da"] 

            RKC_A-- "Message" -->RKC_B
        end
        Proxy["Web Proxy/Balancer"]
        UI["Web Interface"]

        Proxy --> UI
        
    end

    subgraph RK["Artela Rollkit"]
        RK_LN["Light Node"]
        RK_FN["Full Node"]
        RK_SEQ["Sequencer (Aggregator)"]
        RK_RB["Rollup Block"]
        RK_ST["Rollup State"]
        RK_GF["TIA Gas Fee Sequencer"]

        subgraph RK_SC["Smart Contracts"]
            RK_SC_721["NFT"]
        end
    end

    subgraph Celestia["Celestia Data Availability"]
        CL_LN["Celestia Light Node"]
        CL_BN["Celestia Bridge Node"] 
        CL_FN["Celestia Full Storage Node"]

        CL_LN-- "Store Data Call" --> CL_BN
        CL_BN-- "celestia-app" -->CL_FN
    end

    User -- Interact --> Proxy
    UI --1 Submit Tx--> RKC
    RKC -- 2 Submit --> RK_LN
    RK_LN -- 3 Gossip --> RK_FN
    RK_FN -- 4 Notify Tx --> RK_SEQ
    RK_SEQ -- 5 Add Tx -->RK_RB
    RK_FN -- 6 Update --> RK_ST
    RK_FN -- 7 OK --> RK_LN
    RK_LN --  8 OK --> RKC
    RK_SEQ -- 9 Send Rollup Block -->CL_LN
    RK_FN -- 10 Download and Validate Block --> CL_FN

    classDef green fill:#696,stroke:#333;
    classDef purple fill:#969,stroke:#333;
    class RK_GF purple
    class RK_SEQ green
    class RK_SC_721 green
```

> [!IMPORTANT]
> Add sequence diagram
> Research what tasks do we need here?

#### NFT ERC1155

> [!IMPORTANT]
> Add functions flowchart

#### STAKE

```mermaid
flowchart TB
    User["User"]
    Admin["Admin"]

    subgraph Frontend["lazy.fun"]
        subgraph RKC["Rollkit Client"]
            RKC_A["Client"] 
            RKC_B["go-da"] 

            RKC_A-- "Message" -->RKC_B
        end
        Proxy["Web Proxy/Balancer"]
        UI["Web Interface"]

        Proxy --> UI
        
    end

    subgraph RK["Artela Rollkit"]
        subgraph RK_SC["Smart Contracts"]
            RK_SC_721["ERC1155"]
            RK_SC_721_STAKE["Stake/unstake"]
        end
    end

    subgraph Celestia["Celestia Data Availability"]
    end

    User -- Stake [Period] / Unstake --> Proxy
    UI --1 Submit Tx--> RKC
    RKC -- 2 Submit --> RK_SC_721
    RK_SC_721 -- Send [Lock Period] --> RK_SC_721_STAKE
    RK_SC_721_STAKE --> Celestia
```

> **Tasks**

- Solidity Smart contract [cw-nft-staking](https://github.com/Lazychain/cw-nft-staking)
- Web UI [nft-staking-app](https://github.com/thirdweb-example/nft-staking-app)

#### Monitoring

```mermaid
flowchart LR
    Admin["Admin"]
    TG["Telegram"]
    DC["Discord"]

    subgraph MN["Range"]
        MN_UI["Setup/Admin"]
        MN_SC["Service"]
    end

    subgraph RK["Rollkit"]
        RK_LN["Light Node"]
    end

    MN_SC <-- Status --> RK_LN
    MN_SC -- Alarms --> TG
    MN_SC -- Alarms --> DC
    Admin --> MN_UI
```

> **Tasks**

- Create account into Range
- Setup Telegram and Discord Alarms
- Setup Service backend (RPC)
