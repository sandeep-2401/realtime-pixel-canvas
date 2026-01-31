# Benchmark Results

This directory contains load testing results for the WebSocket backend of the collaborative pixel canvas project.

The benchmarks were run to understand how the system behaves as the number of concurrent users increases, and to identify practical limits around connection handling and real-time message delivery. All tests were executed against a single backend instance.

---

## Test Setup

- Backend: Node.js + TypeScript WebSocket server
- Tooling: k6
- Each virtual user opens one WebSocket connection
- Connections remain open for approximately one minute
- Users send periodic pixel update events and receive broadcast updates
- No horizontal scaling, rate limiting, or special tuning applied

---

## Summary of Results

| Metric                  | 50 Users | 100 Users | 150 Users | 200 Users |
|-------------------------|----------|-----------|-----------|-----------|
| Connection Success Rate | 100%     | 100%      | 90.7%     | 51%       |
| Failed Connections      | 0        | 0         | 14        | 98        |
| Avg WS Connect Time     | 0.5 s    | 2.0 s     | 11.7 s    | 30.3 s    |
| p95 WS Connect Time     | 1.2 s    | 5.2 s     | 60 s      | 60 s      |
| Messages Received / sec | ~9,980   | ~12,076   | ~11,008   | ~12,955   |
| Messages Sent / sec     | ~244     | ~456      | ~471      | ~472      |
| Avg Session Duration    | ~1 m     | ~1 m      | ~1 m      | ~1 m      |

---

## Observations

The system operates reliably at 50 and 100 concurrent users, with all WebSocket connections succeeding and connection times remaining within reasonable bounds. Message throughput scales consistently across these loads, and sessions remain stable for the full test duration.

At 150 concurrent users, connection latency increases and a small number of WebSocket handshakes begin to time out. Despite this, successfully connected clients continue to receive updates at expected rates, and no mid-session disconnects were observed.

At 200 concurrent users, the system exceeds its connection handling capacity. Approximately half of the connection attempts fail during the handshake phase, primarily due to timeouts. Clients that do connect remain stable and continue to receive messages at similar throughput levels as lower-load tests.

---

## Bottleneck Identification

Based on these results, the primary limitation lies in WebSocket connection acceptance under high concurrency. Message broadcasting and steady-state session handling remain stable even as connection failures increase, indicating that runtime processing is not the main constraint.

---

## Notes

- Tests were run on a single backend instance
- Canvas state is maintained in memory
- Results represent a baseline rather than a production configuration

---

## Takeaway

The backend comfortably supports up to 100 concurrent users, begins to degrade between 100 and 150 users, and reaches its connection capacity limit at around 200 concurrent connections. These benchmarks provide a clear reference point for future scaling work, particularly around connection handling and deployment architecture.
