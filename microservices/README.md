# Microservice and API Patterns

Use this directory to explore microservice architecture and API design patterns. The guides below are listed in reading order, and each includes its own table of contents for navigating individual patterns.

## Microservice architecture

| Guide | Topics |
| --- | --- |
| [01. Service Boundary and Decomposition Patterns](01_Service_Boundary_and_Decomposition_Patterns.md) | Decomposition by business capability, subdomain, and workflow boundary; stateless services. |
| [02. Legacy Migration and Boundary Protection Patterns](02_Legacy_Migration_and_Boundary_Protection_Patterns.md) | Strangler Fig and Anti-Corruption Layer. |
| [03. Client Access, API Edge, and Composition Patterns](03_Client_Access_API_Edge_and_Composition_Patterns.md) | API gateways, routing, aggregation, offloading, backends for frontends, and UI composition. |
| [04. Service Communication and Workflow Patterns](04_Service_Communication_and_Workflow_Patterns.md) | Service chaining, branching, asynchronous messaging, choreography, sagas, and consumer-driven contracts. |
| [05. Data Ownership, Persistence, and Consistency Patterns](05_Data_Ownership_Persistence_and_Consistency_Patterns.md) | Database ownership, shared databases, CQRS, event sourcing, polyglot persistence, and sharding. |
| [06. Resilience and Failure Isolation Patterns](06_Resilience_and_Failure_Isolation_Patterns.md) | Circuit breakers, retries, bulkheads, and health checks. |
| [07. Service Discovery, Configuration, and Runtime Infrastructure Patterns](07_Service_Discovery_Configuration_and_Runtime_Infrastructure_Patterns.md) | Service discovery and registries, external configuration, and sidecars. |
| [08. Observability Patterns](08_Observability_Patterns.md) | Log aggregation, performance metrics, and distributed tracing. |
| [09. Deployment, Release, and Production Validation Patterns](09_Deployment_Release_and_Production_Validation_Patterns.md) | Blue-green and shadow deployments. |

## API design

| Guide | Topics |
| --- | --- |
| [10. API Design: Responsibility](10_API_Design_Responsibility.md) | Resource responsibilities, computation, state creation and transitions, retrieval, and data holders. |
| [11. API Design: Structure](11_API_Design_Structure.md) | Parameter structures, data and metadata elements, links, context representation, and pagination. |
| [12. API Design: Quality](12_API_Design_Quality.md) | API keys, rate limits and plans, service level agreements, error reports, conditional requests, and response shaping. |
| [13. API Design: Evolution](13_API_Design_Evolution.md) | Version identifiers, semantic versioning, parallel versions, previews, obsolescence, and lifetime guarantees. |
